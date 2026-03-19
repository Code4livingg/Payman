'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, RefreshCcw, Settings } from 'lucide-react';
import { ActivityFeed } from './ActivityFeed';
import { DraftPaymentCard } from './DraftPaymentCard';
import { ExecutionFlow, type ExecutionFlowStatus } from './ExecutionFlow';
import { InvoicesList } from './InvoicesList';
import { InsightsCards } from './InsightsCards';
import { MessageBubble } from './MessageBubble';
import { PaymentConfirmCard } from './PaymentConfirmCard';
import { PaymentExplanationCard } from './PaymentExplanationCard';
import { PaymanLogo } from './PaymanLogo';
import { SchedulesList } from './SchedulesList';
import { TransactionHistoryPanel } from './TransactionHistoryPanel';
import { generateExplanation } from '@/lib/explainer';
import {
  connectMetaMask,
  getMetaMaskUsdtBalance,
  hasMetaMaskProvider,
  isMetaMaskUserRejected,
  sendUsdtWithMetaMask,
  truncateAddress,
  type WalletMode
} from '@/lib/metamask';
import { evaluatePaymentValidation } from '@/lib/policy';
import { storage } from '@/lib/storage';
import type {
  ActivityItem,
  AgentResponse,
  ChatMessage,
  ChatSession,
  DraftPayment,
  Invoice,
  LocalTransaction,
  PaymentExplanation,
  Policy,
  Schedule,
  TabType
} from '@/lib/types';
import { computeNextRun, generateId } from '@/lib/utils';

const PROMPTS = [
  'Send 20 USDT to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e for design work',
  'Pay my developer 100 USDT every Friday',
  'Create invoice for 500 USDT for logo design',
  'How much have I spent this week?'
];
type GuidedFlow = 'menu' | 'send' | 'schedule';

interface WalletState {
  address: string;
  usdt_balance: string;
  network: string;
  demo: boolean;
  label: string;
}

interface ExplanationEntry {
  id: string;
  explanation: PaymentExplanation | null;
}

interface DbTransaction {
  id: string;
  toAddress: string;
  amount: number;
  txHash: string;
  status: string;
  createdAt: string;
}

interface InsightsState {
  totalSpent: number;
  last7DaysSpend: number;
  transactionCount: number;
}

interface ExecFlowState {
  status: ExecutionFlowStatus;
  currentStep: number;
  rejectionReason: string;
  txHash: string;
  amount: number;
  recipient: string;
  memo: string;
}

function isValidExplanation(value: unknown): value is PaymentExplanation {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PaymentExplanation>;
  return (
    typeof candidate.trigger === 'string' &&
    typeof candidate.summary === 'string' &&
    Array.isArray(candidate.checks) &&
    typeof candidate.decision === 'string' &&
    typeof candidate.timestamp === 'string'
  );
}

function userMessage(content: string): ChatMessage {
  return { id: generateId('msg'), role: 'user', content, createdAt: new Date().toISOString() };
}

function agentMessage(content: string, role: 'agent' | 'system' = 'agent'): ChatMessage {
  return { id: generateId('msg'), role, content, createdAt: new Date().toISOString() };
}

function parseAmount(text: string): number {
  const match = text.match(/(\d+(?:\.\d+)?)\s*usdt?/i);
  return match ? Number(match[1]) : 0;
}

function parseAddress(text: string): string {
  return text.match(/0x[a-fA-F0-9]{40}/)?.[0] || '';
}

function parseScheduleFrequency(text: string): 'daily' | 'weekly' | 'monthly' {
  const lower = text.toLowerCase();
  if (lower.includes('month')) return 'monthly';
  if (lower.includes('week') || lower.includes('friday') || lower.includes('monday')) return 'weekly';
  return 'daily';
}

function parseScheduleLabel(text: string): string {
  if (text.toLowerCase().includes('developer')) return 'Developer payment';
  if (text.toLowerCase().includes('design')) return 'Design payment';
  return 'Recurring payment';
}

function parseInvoiceDescription(text: string): string {
  const forMatch = text.match(/for\s+(.+)$/i);
  return forMatch ? forMatch[1].trim() : 'Service invoice';
}

export function ChatInterface({ prefill, sessionId }: { prefill?: string; sessionId?: string }) {
  const router = useRouter();
  const execFlowTimersRef = useRef<number[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [draft, setDraft] = useState<DraftPayment | null>(null);
  const [policy, setPolicy] = useState<Policy>(storage.getDefaultPolicy());
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tab, setTab] = useState<TabType>('activity');
  const [walletMode, setWalletMode] = useState<WalletMode>('demo');
  const [wallet, setWallet] = useState<WalletState>({
    address: 'Loading...',
    usdt_balance: '0.00',
    network: 'Sepolia',
    demo: true,
    label: 'Demo Wallet'
  });
  const [feeEth, setFeeEth] = useState<string>('');
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [paymentExplanations, setPaymentExplanations] = useState<ExplanationEntry[]>([]);
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [insights, setInsights] = useState<InsightsState>({
    totalSpent: 0,
    last7DaysSpend: 0,
    transactionCount: 0
  });
  const [guidedFlow, setGuidedFlow] = useState<GuidedFlow>('menu');
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedRecipient, setGuidedRecipient] = useState('');
  const [guidedAmount, setGuidedAmount] = useState<number>(0);
  const [guidedWhen, setGuidedWhen] = useState('');
  const [showSessionChoice, setShowSessionChoice] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [execFlow, setExecFlow] = useState<ExecFlowState>({
    status: 'idle',
    currentStep: 0,
    rejectionReason: '',
    txHash: '',
    amount: 0,
    recipient: '',
    memo: ''
  });

  useEffect(() => {
    try {
      const savedSessions = storage.getChatSessions();
      const activeSession = storage.getActiveSession();
      const targetId = sessionId || activeSession || savedSessions[0]?.id || generateId('session');
      const existing = savedSessions.find((session) => session.id === targetId);
      const initialMessages = existing?.messages?.length ? existing.messages : [agentMessage('Execution request received. Select an action to continue.')];

      setSessions(savedSessions);
      setCurrentSessionId(targetId);
      setMessages(initialMessages);
      setDraft(storage.getDraft());
      setPolicy(storage.getPolicy());
      setActivity(storage.getActivity());
      setSchedules(storage.getSchedules());
      setInvoices(storage.getInvoices());
      setWalletMode(storage.getWalletMode());
    } catch (error) {
      console.error('Failed to hydrate Payman state', error);
    } finally {
      setHydrated(true);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!hydrated || !currentSessionId) return;
    storage.setMessages(messages);
    storage.setActiveSession(currentSessionId);
    setSessions((prev) => {
      const now = new Date().toISOString();
      const idx = prev.findIndex((session) => session.id === currentSessionId);
      const next = [...prev];
      if (idx >= 0) {
        next[idx] = { ...next[idx], messages, timestamp: now };
      } else {
        next.unshift({ id: currentSessionId, messages, timestamp: now });
      }
      storage.setChatSessions(next);
      return next;
    });
  }, [messages, hydrated, currentSessionId]);

  useEffect(() => {
    if (!hydrated) return;
    storage.setDraft(draft);
  }, [draft, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    storage.setPolicy(policy);
  }, [policy, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    storage.setActivity(activity);
  }, [activity, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    storage.setSchedules(schedules);
  }, [schedules, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    storage.setInvoices(invoices);
  }, [invoices, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    storage.setWalletMode(walletMode);
  }, [walletMode, hydrated]);

  const addActivity = (item: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const next: ActivityItem = {
      id: generateId('act'),
      timestamp: new Date().toISOString(),
      ...item
    };
    setActivity((prev) => [next, ...prev]);
  };

  const addLocalTransaction = (tx: Omit<LocalTransaction, 'id' | 'timestamp'>) => {
    const next: LocalTransaction = {
      id: generateId('ltx'),
      timestamp: new Date().toISOString(),
      ...tx
    };
    const current = storage.getLocalTransactions();
    storage.setLocalTransactions([next, ...current].slice(0, 200));
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const clearExecFlowTimers = () => {
    execFlowTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    execFlowTimersRef.current = [];
  };

  const resetExecutionFlow = () => {
    clearExecFlowTimers();
    setExecFlow({
      status: 'idle',
      currentStep: 0,
      rejectionReason: '',
      txHash: '',
      amount: 0,
      recipient: '',
      memo: ''
    });
  };

  useEffect(() => () => clearExecFlowTimers(), []);

  const showFlowCompleteChoice = () => {
    setShowSessionChoice(true);
    setMessages((prev) => [
      ...prev,
      agentMessage('Do you want to continue or start a new session?', 'system')
    ]);
  };

  const startNewSession = () => {
    const nextSessionId = generateId('session');
    setCurrentSessionId(nextSessionId);
    setDraft(null);
    setInput('');
    setTyping(false);
    setSending(false);
    setGuidedFlow('menu');
    setGuidedStep(0);
    setGuidedRecipient('');
    setGuidedAmount(0);
    setGuidedWhen('');
    setFeeEth('');
    setPaymentExplanations([]);
    setShowSessionChoice(false);
    resetExecutionFlow();
    setMessages([agentMessage('Execution request received. Select an action to continue.')]);
  };

  const getCurrentWalletId = () => {
    if (/^0x[a-fA-F0-9]{40}$/.test(wallet.address)) return wallet.address;
    const stored = storage.getWalletAddress();
    if (/^0x[a-fA-F0-9]{40}$/.test(stored)) return stored;
    return 'demo_user';
  };

  const syncUserIdentity = async (address: string) => {
    if (!address) return;
    try {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address })
      });
    } catch {
      // non-blocking
    }
  };

  const fetchPolicyFromApi = async (walletId: string) => {
    try {
      const response = await fetch(`/api/policy?wallet=${encodeURIComponent(walletId)}`);
      const data = await response.json();
      if (data.ok && data.policy) {
        setPolicy(data.policy);
        storage.setPolicy(data.policy);
        return;
      }
    } catch {
      // fallback to local storage
    }
    setPolicy(storage.getPolicy());
  };

  const fetchProductData = async (walletId: string) => {
    try {
      const [txRes, insightsRes] = await Promise.all([
        fetch(`/api/transactions?wallet=${encodeURIComponent(walletId)}`),
        fetch(`/api/insights?wallet=${encodeURIComponent(walletId)}`)
      ]);

      const txData = await txRes.json();
      const insightsData = await insightsRes.json();

      if (txData.ok && Array.isArray(txData.transactions)) {
        setTransactions(txData.transactions);
      }
      if (insightsData.ok && insightsData.insights) {
        setInsights(insightsData.insights);
      }
    } catch {
      setTransactions([]);
      setInsights({ totalSpent: 0, last7DaysSpend: 0, transactionCount: 0 });
    }
  };

  const persistTransaction = async (payload: {
    toAddress: string;
    amount: number;
    memo?: string;
    txHash: string;
    status: 'success' | 'failed' | 'demo';
  }) => {
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: getCurrentWalletId(),
          ...payload
        })
      });
      await fetchProductData(getCurrentWalletId());
    } catch {
      // DB fallback silently
    }
  };

  const spentThisWeek = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return activity
      .filter((item) => item.type === 'payment_sent' && now - new Date(item.timestamp).getTime() <= weekMs)
      .reduce((sum, item) => sum + Number(item.metadata?.amount_usdt || 0), 0);
  }, [activity]);

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();
      if (data.ok) {
        const walletId = /^0x[a-fA-F0-9]{40}$/.test(data.address) ? data.address : 'demo_user';
        storage.setWalletAddress(walletId);
        setWallet({
          address: data.address,
          usdt_balance: data.usdt_balance,
          network: data.network,
          demo: true,
          label: 'Demo Wallet'
        });
        await syncUserIdentity(walletId);
        await fetchPolicyFromApi(walletId);
        await fetchProductData(walletId);
      }
    } catch {
      setWallet((prev) => ({ ...prev, address: 'Demo Wallet', demo: true, label: 'Demo Wallet' }));
    }
  };

  const refreshMetaMaskWallet = async () => {
    try {
      const connected = await connectMetaMask();
      const balance = await getMetaMaskUsdtBalance(connected.address);
      storage.setWalletAddress(connected.address);
      setWallet({
        address: connected.address,
        usdt_balance: balance,
        network: 'Sepolia',
        demo: false,
        label: 'Connected: MetaMask'
      });
      setWalletMode('metamask');
      await syncUserIdentity(connected.address);
      await fetchPolicyFromApi(connected.address);
      await fetchProductData(connected.address);
    } catch (error) {
      console.warn('MetaMask failed, falling back', error);
      setWalletMode('demo');
      await fetchWallet();
    }
  };

  useEffect(() => {
    const initWallet = async () => {
      const hasMetaMask = typeof window !== 'undefined' && (window as Window & { ethereum?: unknown }).ethereum;
      if (hasMetaMaskProvider() && hasMetaMask) {
        await refreshMetaMaskWallet();
      } else {
        setWalletMode('demo');
        await fetchWallet();
      }
    };

    void initWallet();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const walletId = getCurrentWalletId();
    void fetchPolicyFromApi(walletId);
    void fetchProductData(walletId);
  }, [hydrated, wallet.address]);

  useEffect(() => {
    if (!hydrated || !prefill) return;
    if (!messages.length) {
      onSendMessage(prefill);
    }
  }, [hydrated, prefill, messages.length]);

  useEffect(() => {
    if (!draft?.to_address || !draft.amount_usdt) {
      setFeeEth('');
      return;
    }

    const timer = setTimeout(async () => {
      const resp = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: getCurrentWalletId(),
          mode: 'quote',
          to_address: draft.to_address,
          amount_usdt: draft.amount_usdt,
          memo: draft.memo,
          policy,
          activity
        })
      });
      const data = await resp.json();
      if (data.ok) setFeeEth(data.fee_eth || '0.00042');
    }, 200);

    return () => clearTimeout(timer);
  }, [draft, policy, activity]);

  const executeDraftThroughPipeline = async (currentDraft: DraftPayment) => {
    setSending(true);

    try {
      const quoteResponse = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: getCurrentWalletId(),
          mode: 'quote',
          to_address: currentDraft.to_address,
          amount_usdt: currentDraft.amount_usdt,
          memo: currentDraft.memo,
          policy,
          activity
        })
      });
      const quoteData = await quoteResponse.json();

      if (!quoteData.ok) {
        const reason = quoteData.error || 'Policy validation failed';
        setExecFlow({
          status: 'blocked',
          currentStep: 2,
          rejectionReason: reason,
          txHash: '',
          amount: currentDraft.amount_usdt,
          recipient: currentDraft.to_address,
          memo: currentDraft.memo || ''
        });
        addLocalTransaction({
          recipient: 'Manual payment',
          to_address: currentDraft.to_address,
          amount_usdt: currentDraft.amount_usdt,
          status: 'failed',
          failure_reason: `BLOCKED: ${reason}`
        });
        addActivity({
          type: 'payment_blocked',
          title: 'Payment blocked',
          description: `BLOCKED: ${reason}`,
          metadata: { to_address: currentDraft.to_address, amount_usdt: currentDraft.amount_usdt, wallet_mode: walletMode }
        });
        setMessages((prev) => [...prev, agentMessage(`Execution halted: BLOCKED: ${reason}`, 'system')]);
        showFlowCompleteChoice();
        return;
      }

      clearExecFlowTimers();
      setExecFlow({
        status: 'running',
        currentStep: 0,
        rejectionReason: '',
        txHash: '',
        amount: currentDraft.amount_usdt,
        recipient: currentDraft.to_address,
        memo: currentDraft.memo || ''
      });

      execFlowTimersRef.current = [
        window.setTimeout(() => setExecFlow((prev) => ({ ...prev, currentStep: 1 })), 700),
        window.setTimeout(() => setExecFlow((prev) => ({ ...prev, currentStep: 2 })), 1400),
        window.setTimeout(() => setExecFlow((prev) => ({ ...prev, currentStep: 3 })), 2100),
        window.setTimeout(() => setExecFlow((prev) => ({ ...prev, status: 'awaiting', currentStep: 4 })), 2800)
      ];
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Execution error';
      setExecFlow({
        status: 'blocked',
        currentStep: 2,
        rejectionReason: reason,
        txHash: '',
        amount: currentDraft.amount_usdt,
        recipient: currentDraft.to_address,
        memo: currentDraft.memo || ''
      });
      setMessages((prev) => [...prev, agentMessage(`Execution error: ${reason}`, 'system')]);
      showFlowCompleteChoice();
    } finally {
      setSending(false);
    }
  };

  const handleExecutionConfirm = async () => {
    if (!draft) return;

    setSending(true);
    clearExecFlowTimers();
    setExecFlow((prev) => ({
      ...prev,
      status: 'running',
      currentStep: 5,
      rejectionReason: '',
      txHash: ''
    }));

    try {
      if (walletMode === 'metamask') {
        try {
          const tx = await sendUsdtWithMetaMask(draft.to_address, draft.amount_usdt);
          const validationResults = evaluatePaymentValidation(draft, policy, activity);
          const explanation = generateExplanation({
            triggerType: 'manual_command',
            policy,
            draft,
            validationResults
          });

          addActivity({
            type: 'payment_sent',
            title: 'USDT payment sent',
            description: `${draft.amount_usdt} USDT sent to ${draft.to_address}`,
            metadata: {
              to_address: draft.to_address,
              amount_usdt: draft.amount_usdt,
              tx_hash: tx.txHash,
              memo: draft.memo || '',
              fallback: false,
              wallet_mode: 'metamask'
            }
          });
          addLocalTransaction({
            recipient: 'Manual payment',
            to_address: draft.to_address,
            amount_usdt: draft.amount_usdt,
            status: 'success',
            tx_hash: tx.txHash
          });
          await persistTransaction({
            toAddress: draft.to_address,
            amount: draft.amount_usdt,
            memo: draft.memo,
            txHash: tx.txHash,
            status: 'success'
          });
          await wait(1500);
          setExecFlow((prev) => ({ ...prev, currentStep: 6 }));
          setMessages((prev) => [
            ...prev,
            agentMessage(`Transaction submitted via MetaMask. Tx: ${tx.txHash}\nExplorer: ${tx.explorerUrl}`, 'system')
          ]);
          setPaymentExplanations((prev) => [...prev, { id: generateId('exp'), explanation }]);
          setDraft(null);
          setExecFlow((prev) => ({
            ...prev,
            status: 'complete',
            currentStep: 6,
            txHash: tx.txHash
          }));
          await refreshMetaMaskWallet();
          showFlowCompleteChoice();
          return;
        } catch (error) {
          if (isMetaMaskUserRejected(error)) {
            addLocalTransaction({
              recipient: 'Manual payment',
              to_address: draft.to_address,
              amount_usdt: draft.amount_usdt,
              status: 'failed',
              failure_reason: 'User rejected wallet confirmation'
            });
            setExecFlow((prev) => ({
              ...prev,
              status: 'blocked',
              currentStep: 5,
              rejectionReason: 'User rejected wallet confirmation'
            }));
            setMessages((prev) => [...prev, agentMessage('Execution cancelled: MetaMask authorization rejected.', 'system')]);
            showFlowCompleteChoice();
            return;
          }

          console.warn('MetaMask failed, falling back', error);
          setWalletMode('demo');
        }
      }

      const sendResult = await executeApiPayment(draft);
      if (sendResult.ok) {
        await wait(1500);
        setExecFlow((prev) => ({ ...prev, currentStep: 6 }));
        setExecFlow((prev) => ({
          ...prev,
          status: 'complete',
          currentStep: 6,
          txHash: sendResult.txHash || ''
        }));
      } else {
        setExecFlow((prev) => ({
          ...prev,
          status: 'blocked',
          currentStep: 5,
          rejectionReason: sendResult.error || 'Execution failed'
        }));
      }
      showFlowCompleteChoice();
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Execution error';
      setExecFlow((prev) => ({
        ...prev,
        status: 'blocked',
        currentStep: 5,
        rejectionReason: reason
      }));
      setMessages((prev) => [...prev, agentMessage(`Execution error: ${reason}`, 'system')]);
      showFlowCompleteChoice();
    } finally {
      setSending(false);
    }
  };

  const resetGuided = () => {
    setGuidedStep(0);
    setGuidedRecipient('');
    setGuidedAmount(0);
    setGuidedWhen('');
    setGuidedFlow('menu');
  };

  const startGuidedFlow = (flow: GuidedFlow) => {
    setGuidedFlow(flow);
    setGuidedRecipient('');
    setGuidedAmount(0);
    setGuidedWhen('');
    setGuidedStep(1);
    setMessages((prev) => [
      ...prev,
      agentMessage(
        flow === 'send'
          ? 'Execution request received. Provide recipient address.'
          : 'Execution request received. Provide recipient for scheduled payment.'
      )
    ]);
  };

  const handleGuidedInput = async (text: string): Promise<boolean> => {
    if (guidedStep === 0) return false;

    if (guidedFlow === 'send') {
      if (guidedStep === 1) {
        setGuidedRecipient(text);
        setGuidedStep(2);
        setMessages((prev) => [...prev, agentMessage('Validating input... Provide USDT amount.')]);
        return true;
      }

      if (guidedStep === 2) {
        const amount = Number(text);
        if (!Number.isFinite(amount) || amount <= 0) {
          setMessages((prev) => [...prev, agentMessage('Validation failed. Enter a valid USDT amount (for example: 20).', 'system')]);
          return true;
        }
        setGuidedAmount(amount);
        setGuidedStep(3);
        setMessages((prev) => [...prev, agentMessage(`Authorization checkpoint: send ${amount} USDT to ${guidedRecipient}. Type "yes" to confirm.`)]);
        return true;
      }

      if (guidedStep === 3) {
        if (!/^(yes|confirm|send)$/i.test(text)) {
          setMessages((prev) => [...prev, agentMessage('Execution cancelled. Returning to command menu.', 'system')]);
          resetGuided();
          return true;
        }

        const nextDraft: DraftPayment = {
          to_address: guidedRecipient,
          amount_usdt: guidedAmount,
          memo: 'Guided payment'
        };

        setDraft(nextDraft);
        setMessages((prev) => [...prev, agentMessage('Running policy checks... Authorization in progress...', 'system')]);
        resetGuided();
        await executeDraftThroughPipeline(nextDraft);
        return true;
      }
    }

    if (guidedFlow === 'schedule') {
      if (guidedStep === 1) {
        setGuidedRecipient(text);
        setGuidedStep(2);
        setMessages((prev) => [...prev, agentMessage('Validating input... Provide scheduled USDT amount.')]);
        return true;
      }

      if (guidedStep === 2) {
        const amount = Number(text);
        if (!Number.isFinite(amount) || amount <= 0) {
          setMessages((prev) => [...prev, agentMessage('Validation failed. Enter a valid USDT amount (for example: 100).', 'system')]);
          return true;
        }
        setGuidedAmount(amount);
        setGuidedStep(3);
        setMessages((prev) => [...prev, agentMessage('Execution schedule requested. Provide date or delay trigger.')]);
        return true;
      }

      if (guidedStep === 3) {
        setGuidedWhen(text);
        setGuidedStep(4);
        setMessages((prev) => [
          ...prev,
          agentMessage(`Authorization checkpoint: schedule ${guidedAmount} USDT to ${guidedRecipient} for "${text}". Type "yes" to confirm.`)
        ]);
        return true;
      }

      if (guidedStep === 4) {
        if (!/^(yes|confirm|schedule)$/i.test(text)) {
          setMessages((prev) => [...prev, agentMessage('Schedule execution cancelled. Returning to command menu.', 'system')]);
          resetGuided();
          return true;
        }

        const now = new Date().toISOString();
        const schedule: Schedule = {
          id: generateId('sch'),
          to_address: guidedRecipient,
          amount_usdt: guidedAmount,
          memo: `Scheduled for ${guidedWhen}`,
          frequency: 'weekly',
          start_date: now,
          next_run: computeNextRun('weekly', now),
          total_executed: 0,
          paused: false,
          created_at: now,
          label: 'Guided schedule'
        };
        setSchedules((prev) => [schedule, ...prev]);
        addActivity({
          type: 'schedule_executed',
          title: 'Schedule created',
          description: `${guidedAmount} USDT to ${guidedRecipient} (${guidedWhen})`,
          metadata: { schedule_id: schedule.id }
        });
        setMessages((prev) => [
          ...prev,
          agentMessage('Schedule created. Policy checks passed. Execution simulation queued.', 'system')
        ]);
        resetGuided();
        showFlowCompleteChoice();
        return true;
      }
    }

    return false;
  };

  const onSendMessage = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    setShowSessionChoice(false);

    const nextUserMessage = userMessage(text);
    setMessages((prev) => [...prev, nextUserMessage]);
    setInput('');

    const lower = text.toLowerCase();
    if (guidedStep > 0) {
      const handledGuided = await handleGuidedInput(text);
      if (handledGuided) return;
    }

    if (['hi', 'hello', 'hey'].includes(lower)) {
      resetGuided();
      setMessages((prev) => [...prev, agentMessage('Execution request received. Select an action to continue.')]);
      return;
    }

    if (lower === 'send payment') {
      startGuidedFlow('send');
      return;
    }

    if (lower === 'schedule payment') {
      startGuidedFlow('schedule');
      return;
    }

    if (lower === 'view invoices') {
      setTab('invoices');
      setMessages((prev) => [...prev, agentMessage('Invoice ledger opened. Review pending and paid records in the sidebar.')]);
      return;
    }

    if (lower === 'check spending') {
      setTab('activity');
      setMessages((prev) => [...prev, agentMessage(`Spending summary generated: ${spentThisWeek.toFixed(2)} USDT in the last 7 days.`)]);
      return;
    }

    setTyping(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, draft })
      });

      const parsed = (await response.json()) as AgentResponse;

      if (parsed.type === 'cancel') {
        setDraft(null);
      }

      if (parsed.draft) {
        setDraft(parsed.draft);
      }

      if (parsed.type === 'schedule') {
        const frequency = parseScheduleFrequency(text);
        const amount = parseAmount(text) || draft?.amount_usdt || 0;
        const toAddress = parseAddress(text) || draft?.to_address;

        if (toAddress && amount > 0) {
          const now = new Date().toISOString();
          const schedule: Schedule = {
            id: generateId('sch'),
            to_address: toAddress,
            amount_usdt: amount,
            memo: draft?.memo,
            frequency,
            start_date: now,
            next_run: computeNextRun(frequency, now),
            total_executed: 0,
            paused: false,
            created_at: now,
            label: parseScheduleLabel(text)
          };
          setSchedules((prev) => [schedule, ...prev]);
          addActivity({
            type: 'schedule_executed',
            title: 'Schedule created',
            description: `${schedule.label}: ${schedule.amount_usdt} USDT ${schedule.frequency}`,
            metadata: { schedule_id: schedule.id }
          });
        }

        if (/pause/i.test(text)) {
          const target = schedules.find((s) => text.toLowerCase().includes(s.label.toLowerCase().split(' ')[0]));
          if (target) {
            setSchedules((prev) => prev.map((s) => (s.id === target.id ? { ...s, paused: true } : s)));
            addActivity({
              type: 'schedule_paused',
              title: 'Schedule paused',
              description: `${target.label} was paused from chat command`,
              metadata: { schedule_id: target.id }
            });
          }
        }
      }

      if (parsed.type === 'invoice') {
        const amount = parseAmount(text) || draft?.amount_usdt || 0;
        const recipient = parseAddress(text) || wallet.address;
        if (amount > 0) {
          const now = new Date();
          const due = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
          const invoice: Invoice = {
            id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
            issue_date: now.toISOString(),
            due_date: due.toISOString(),
            amount_usdt: amount,
            description: parseInvoiceDescription(text),
            recipient_wallet: recipient,
            status: 'pending',
            created_at: now.toISOString()
          };

          setInvoices((prev) => [invoice, ...prev]);
          addActivity({
            type: 'invoice_generated',
            title: 'Invoice generated',
            description: `${invoice.id} for ${invoice.amount_usdt} USDT`,
            metadata: { invoice_id: invoice.id }
          });
          setMessages((prev) => [
            ...prev,
            agentMessage(`${parsed.message}\nInvoice ${invoice.id} has been created and is shareable.`)
          ]);
          showFlowCompleteChoice();
          setTyping(false);
          return;
        }
      }

      if (parsed.type === 'query' && /spent/i.test(text.toLowerCase())) {
        setMessages((prev) => [
          ...prev,
          agentMessage(`Spending summary generated: ${spentThisWeek.toFixed(2)} USDT in the last 7 days.`)
        ]);
        showFlowCompleteChoice();
        setTyping(false);
        return;
      }

      setMessages((prev) => [...prev, agentMessage(parsed.message)]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        agentMessage(`Parser exception detected: ${error instanceof Error ? error.message : 'unknown error'}`, 'system')
      ]);
    } finally {
      setTyping(false);
    }
  };

  const executeApiPayment = async (currentDraft: DraftPayment): Promise<{ ok: boolean; error?: string; txHash?: string }> => {
    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: getCurrentWalletId(),
        mode: 'send',
        to_address: currentDraft.to_address,
        amount_usdt: currentDraft.amount_usdt,
        memo: currentDraft.memo,
        policy,
        activity
      })
    });
    const data = await response.json();

    if (!data.ok) {
      addLocalTransaction({
        recipient: 'Manual payment',
        to_address: currentDraft.to_address,
        amount_usdt: currentDraft.amount_usdt,
        status: 'failed',
        failure_reason: data.error || 'Unknown send failure'
      });
      addActivity({
        type: 'payment_failed',
        title: 'Payment failed',
        description: data.error || 'Unknown send failure',
        metadata: { to_address: currentDraft.to_address, amount_usdt: currentDraft.amount_usdt }
      });
      setMessages((prev) => [...prev, agentMessage(`Execution halted: ${data.error}`, 'system')]);
      return { ok: false, error: data.error || 'Unknown send failure' };
    }

    addActivity({
      type: 'payment_sent',
      title: 'USDT payment sent',
      description: `${currentDraft.amount_usdt} USDT sent to ${currentDraft.to_address}`,
      metadata: {
        to_address: currentDraft.to_address,
        amount_usdt: currentDraft.amount_usdt,
        tx_hash: data.tx_hash,
        memo: currentDraft.memo || '',
        fallback: data.fallback || false,
        wallet_mode: 'demo'
      }
    });
    addLocalTransaction({
      recipient: 'Manual payment',
      to_address: currentDraft.to_address,
      amount_usdt: currentDraft.amount_usdt,
      status: 'success',
      tx_hash: data.tx_hash
    });
    setMessages((prev) => [
      ...prev,
      agentMessage(
        `Transaction submitted. Tx: ${data.tx_hash}\nExplorer: ${data.explorer_url}${data.fallback ? '\nDemo fallback mode was used.' : ''}`,
        'system'
      )
    ]);

    if (isValidExplanation(data.explanation)) {
      setPaymentExplanations((prev) => [...prev, { id: generateId('exp'), explanation: data.explanation }]);
    }

    setDraft(null);
    await fetchWallet();
    return { ok: true, txHash: data.tx_hash };
  };

  const onConfirmPayment = async () => {
    if (!draft) return;
    await executeDraftThroughPipeline(draft);
  };

  const handleInputChange = (value: string) => {
    if (execFlow.status !== 'idle') {
      resetExecutionFlow();
    }
    setInput(value);
  };

  const runDueSchedules = async () => {
    const payload = encodeURIComponent(JSON.stringify({ schedules, policy, activity }));
    const resp = await fetch(`/api/cron?payload=${payload}`);
    const data = await resp.json();
    if (!data.ok) return;

    if (Array.isArray(data.schedules)) {
      setSchedules(data.schedules);
    }

    (data.executed || []).forEach((exec: { id: string; tx_hash: string }) => {
      addActivity({
        type: 'schedule_executed',
        title: 'Schedule executed',
        description: `Schedule ${exec.id} executed. Tx ${exec.tx_hash}`,
        metadata: { schedule_id: exec.id, tx_hash: exec.tx_hash }
      });
    });

    (data.failed || []).forEach((fail: { id: string; reason: string }) => {
      addActivity({
        type: 'schedule_failed',
        title: 'Schedule failed',
        description: `Schedule ${fail.id} failed: ${fail.reason}`,
        metadata: { schedule_id: fail.id }
      });
    });
  };

  useEffect(() => {
    if (!hydrated) return;
    const t = setInterval(runDueSchedules, 60_000);
    return () => clearInterval(t);
  }, [hydrated, schedules, policy, activity]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setInterval(() => {
      const now = Date.now();
      let changed = false;

      setInvoices((prev) =>
        prev.map((invoice) => {
          if (invoice.status === 'pending' && new Date(invoice.due_date).getTime() < now) {
            changed = true;
            addActivity({
              type: 'invoice_overdue',
              title: 'Invoice overdue',
              description: `${invoice.id} is now overdue`,
              metadata: { invoice_id: invoice.id }
            });
            return { ...invoice, status: 'overdue' };
          }

          if (invoice.status !== 'paid') {
            const match = activity.find(
              (item) =>
                item.type === 'payment_sent' &&
                Number(item.metadata?.amount_usdt || 0) === invoice.amount_usdt &&
                String(item.metadata?.to_address || '').toLowerCase() === invoice.recipient_wallet.toLowerCase()
            );
            if (match) {
              changed = true;
              addActivity({
                type: 'invoice_paid',
                title: 'Invoice paid',
                description: `${invoice.id} marked paid from outgoing activity match`,
                metadata: { invoice_id: invoice.id, tx_hash: String(match.metadata?.tx_hash || '') }
              });
              return {
                ...invoice,
                status: 'paid',
                paid_tx_hash: String(match.metadata?.tx_hash || ''),
                paid_at: new Date().toISOString()
              };
            }
          }

          return invoice;
        })
      );

      if (changed) {
        setMessages((prev) => [...prev, agentMessage('Invoice watcher updated invoice statuses.', 'system')]);
      }
    }, 30_000);

    return () => clearInterval(timer);
  }, [hydrated, activity]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setInterval(async () => {
      await fetchWallet();

      const now = Date.now();
      const due24h = schedules
        .filter((schedule) => !schedule.paused)
        .filter((schedule) => new Date(schedule.next_run).getTime() <= now + 24 * 60 * 60 * 1000)
        .reduce((sum, schedule) => sum + schedule.amount_usdt, 0);

      const balance = Number(wallet.usdt_balance);
      if (due24h > balance) {
        addActivity({
          type: 'low_balance_warning',
          title: 'Low balance warning',
          description: `${balance.toFixed(2)} USDT remaining, ${due24h.toFixed(2)} USDT due in next 24h`,
          metadata: { balance, due_24h: due24h }
        });

        setMessages((prev) => [
          ...prev,
          agentMessage(
            `Low balance warning: ${balance.toFixed(2)} USDT remaining, ${due24h.toFixed(2)} USDT due in scheduled payments tomorrow.`,
            'system'
          )
        ]);
      }
    }, 60_000);

    return () => clearInterval(timer);
  }, [hydrated, schedules, wallet.usdt_balance]);

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading Payman...</div>;
  }

  const showConfirm = Boolean(draft?.to_address && draft?.amount_usdt && execFlow.status === 'idle');

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-xl backdrop-blur-xl">
          <PaymanLogo size="sm" />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">{walletMode === 'metamask' ? 'Connected: MetaMask' : 'Demo Wallet'}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                walletMode === 'metamask'
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30'
              }`}
            >
              {walletMode === 'metamask' ? 'MetaMask Connected' : 'Demo Mode'}
            </span>
          </div>
          <p className="mt-1 break-all font-mono text-xs text-slate-200">
            {walletMode === 'metamask' ? truncateAddress(wallet.address) : wallet.address}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">USDT Balance</p>
            <button
              onClick={() => setBalanceVisible((prev) => !prev)}
              className="rounded-md border border-white/10 p-1 text-slate-300 hover:bg-white/[0.04]"
              aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
            >
              {balanceVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          </div>
          <p className="text-3xl font-bold text-[#00c896] [text-shadow:0_0_22px_rgba(0,200,150,0.28)]">{balanceVisible ? wallet.usdt_balance : '****'}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={walletMode === 'metamask' ? refreshMetaMaskWallet : fetchWallet}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/[0.04]"
            >
              <RefreshCcw className="h-3 w-3" /> Refresh
            </button>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/[0.04]"
            >
              <Settings className="h-3 w-3" /> Settings
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs">
            {(['activity', 'schedules', 'invoices'] as TabType[]).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-full px-2 py-1 capitalize transition ${tab === item ? 'bg-[#00c896] text-black' : 'text-slate-300 hover:bg-white/[0.04]'}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div key={tab} className="mt-4 max-h-[55vh] overflow-auto pr-1 animate-page-enter">
            {tab === 'activity' && (
              <div className="space-y-3">
                <InsightsCards
                  totalSpent={insights.totalSpent}
                  last7DaysSpend={insights.last7DaysSpend}
                  transactionCount={insights.transactionCount}
                />
                <TransactionHistoryPanel transactions={transactions} />
                <ActivityFeed items={activity} />
              </div>
            )}
            {tab === 'schedules' && (
              <SchedulesList
                schedules={schedules}
                onTogglePause={(id) => setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, paused: !s.paused } : s)))}
                onDelete={(id) => setSchedules((prev) => prev.filter((s) => s.id !== id))}
              />
            )}
            {tab === 'invoices' && <InvoicesList invoices={invoices} />}
          </div>
        </aside>

        <main className="flex min-h-[80vh] flex-col rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl backdrop-blur-xl">
          <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6">
            {!messages.length && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-3 text-sm text-slate-300">Try one of these prompts:</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => onSendMessage(prompt)}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left text-sm text-slate-200 transition hover:border-[#00c896]/40 hover:bg-[rgba(0,200,150,0.04)]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {guidedStep === 0 && messages.length <= 2 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 ease-in-out">
                <p className="mb-3 text-sm text-slate-300">Choose an action:</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {['Send Payment', 'Schedule Payment', 'View Invoices', 'Check Spending'].map((option, idx) => (
                    <button
                      key={option}
                      onClick={() => onSendMessage(option)}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left text-sm text-slate-200 transition hover:border-[#00c896]/40 hover:bg-[rgba(0,200,150,0.04)]"
                    >
                      <span className={`mr-2 inline-block h-2 w-2 rounded-full ${idx === 0 ? 'bg-[#00c896]' : idx === 1 ? 'bg-[#7c3aed]' : idx === 2 ? 'bg-cyan-300' : 'bg-amber-300'}`} />
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {paymentExplanations.map((item) =>
              item.explanation ? <PaymentExplanationCard key={item.id} explanation={item.explanation} /> : null
            )}

            {draft && <DraftPaymentCard draft={draft} />}
            {showConfirm && draft && (
              <PaymentConfirmCard draft={draft} feeEth={feeEth} sending={sending} onConfirm={onConfirmPayment} />
            )}

            {typing && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-slate-300">
                <span>Validating input...</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                </span>
              </div>
            )}

            {showSessionChoice && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-3 text-sm text-slate-300">Do you want to continue or start a new session?</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowSessionChoice(false)}
                    className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 hover:border-[#00c896]/40 hover:bg-[rgba(0,200,150,0.08)]"
                  >
                    Continue Chat
                  </button>
                  <button
                    onClick={startNewSession}
                    className="rounded-full bg-[#00c896] px-3 py-2 text-sm font-medium text-black hover:brightness-110"
                  >
                    Start New Chat
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-4">
            {execFlow.status !== 'idle' && (
              <div className="mb-4">
                <ExecutionFlow
                  currentStep={execFlow.currentStep}
                  status={execFlow.status}
                  rejectionReason={execFlow.rejectionReason}
                  txHash={execFlow.txHash}
                  amount={execFlow.amount}
                  recipient={execFlow.recipient}
                  memo={execFlow.memo}
                  onConfirm={handleExecutionConfirm}
                  onRetry={resetExecutionFlow}
                  onOpenSettings={() => router.push('/settings')}
                />
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => handleInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSendMessage();
                }}
                placeholder="Ask Payman to send, schedule, invoice, or query spending..."
                className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#00c896] focus:shadow-[0_0_0_3px_rgba(0,200,150,0.1)]"
              />
              <button
                onClick={() => onSendMessage()}
                disabled={!input.trim() || typing}
                className="rounded-full bg-[#00c896] px-5 py-3 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
