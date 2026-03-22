'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, RefreshCcw, Settings } from 'lucide-react';
import { ActivityFeed } from './ActivityFeed';
import { ExecutionFlow, type ExecutionFlowStatus } from './ExecutionFlow';
import { InvoicesList } from './InvoicesList';
import { InsightsCards } from './InsightsCards';
import { MessageBubble } from './MessageBubble';
import { PaymentExplanationCard } from './PaymentExplanationCard';
import { PaymanLogo } from './PaymanLogo';
import { SchedulesList } from './SchedulesList';
import { TransactionHistoryPanel } from './TransactionHistoryPanel';
import { truncateAddress } from '@/lib/metamask';
import { storage } from '@/lib/storage';
import { generateId, computeNextRun } from '@/lib/utils';
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

const PROMPTS = [
  'Send 20 USDC to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e for design work',
  'Schedule 100 USDC to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e every Friday',
  'Create invoice for 500 USDC for logo design',
  'How much have I spent this week?'
];

interface WalletState {
  address: string;
  usdt_balance: string;
  network: string;
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

function agentMessage(content: string, role: 'agent' | 'system' = 'agent', txHash?: string): ChatMessage {
  return { id: generateId('msg'), role, content, createdAt: new Date().toISOString(), txHash };
}

function parseAmount(text: string): number {
  const match = text.match(/(\d+(?:\.\d+)?)\s*usd[ct]?/i);
  return match ? Number(match[1]) : 0;
}

function parseAddress(text: string): string {
  const match = text.match(/(?<![a-fA-F0-9])0x[a-fA-F0-9]{40}(?![a-fA-F0-9])/);
  return match ? match[0].trim().toLowerCase() : '';
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
  const [wallet, setWallet] = useState<WalletState>({
    address: 'Loading...',
    usdt_balance: '0.00',
    network: 'Sepolia',
    label: 'WDK Wallet'
  });
  const [feeEth, setFeeEth] = useState<string>('');
  const [input, setInput] = useState('');  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [paymentExplanations, setPaymentExplanations] = useState<ExplanationEntry[]>([]);
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [insights, setInsights] = useState<InsightsState>({
    totalSpent: 0,
    last7DaysSpend: 0,
    transactionCount: 0
  });
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

  // Aave yield vault state
  const [aaveBalance, setAaveBalance] = useState(847.32);
  const [aaveYield, setAaveYield] = useState(12.18);
  const [autoAave, setAutoAave] = useState(false);
  const [aaveLoading, setAaveLoading] = useState(false);

  useEffect(() => {
    try {
      // Always start with a fresh chat — messages are ephemeral UI state
      const newSessionId = sessionId || generateId('session');
      setCurrentSessionId(newSessionId);
      setMessages([]);
      setDraft(storage.getDraft());
      setPolicy(storage.getPolicy());
      setActivity(storage.getActivity());
      setSchedules(storage.getSchedules());
      setInvoices(storage.getInvoices());
      // Keep sessions list for reference but don't restore messages
      setSessions(storage.getChatSessions());
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


  // Load Aave state from localStorage and fetch balance
  useEffect(() => {
    if (!hydrated) return;
    try {
      const savedAutoAave = localStorage.getItem('payman_auto_aave');
      if (savedAutoAave) setAutoAave(JSON.parse(savedAutoAave) as boolean);
    } catch { /* ignore */ }

    const fetchAaveData = async () => {
      try {
        const [balRes, yieldRes] = await Promise.all([
          fetch('/api/aave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'balance' }) }),
          fetch('/api/aave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'yield' }) })
        ]);
        const balData = await balRes.json() as { success: boolean; aaveBalance?: number };
        const yieldData = await yieldRes.json() as { success: boolean; yield?: number };
        if (balData.success && balData.aaveBalance !== undefined) setAaveBalance(balData.aaveBalance);
        if (yieldData.success && yieldData.yield !== undefined) setAaveYield(yieldData.yield);
      } catch { /* use Aave defaults */ }
    };

    void fetchAaveData();
  }, [hydrated]);

  // Auto-deposit idle funds every 60s
  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(async () => {
      if (!autoAave) return;
      const balance = Number(wallet.usdt_balance);
      const threshold = Number(localStorage.getItem('payman_aave_threshold') || '200');
      const reserve = Number(localStorage.getItem('payman_aave_reserve') || '100');
      if (balance > threshold) {
        const depositAmount = Number((balance - reserve).toFixed(2));
        if (depositAmount <= 0) return;
        try {
          const res = await fetch('/api/aave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deposit', amount: depositAmount })
          });
          const data = await res.json() as { success: boolean; txHash?: string };
          if (data.success) {
            const prev = Number(localStorage.getItem('payman_aave_deposited') || '0');
            localStorage.setItem('payman_aave_deposited', String(prev + depositAmount));
            setAaveBalance((b) => b + depositAmount);
            addActivity({
              type: 'aave_deposit',
              title: 'Auto-deposited to Aave',
              description: `Auto-deposited ${depositAmount.toFixed(2)} USDC to Aave yield vault`,
              metadata: { amount_usdt: depositAmount, tx_hash: data.txHash || '' }
            });
            setMessages((prev) => [...prev, agentMessage(`Auto-deposit: ${depositAmount.toFixed(2)} USDC → Aave yield vault`, 'system')]);
            await fetchWallet();
          }
        } catch { /* non-blocking */ }
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [hydrated, autoAave, wallet.usdt_balance]);

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

  const handleAaveDeposit = async (amount: number) => {
    setAaveLoading(true);
    try {
      const res = await fetch('/api/aave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deposit', amount })
      });
      const data = await res.json() as { success: boolean; txHash?: string };
      if (data.success) {
        const prev = Number(localStorage.getItem('payman_aave_deposited') || '0');
        localStorage.setItem('payman_aave_deposited', String(prev + amount));
        setAaveBalance((b) => b + amount);
        addActivity({
          type: 'aave_deposit',
          title: 'Deposited to Aave',
          description: `Deposited ${amount.toFixed(2)} USDC to Aave yield vault`,
          metadata: { amount_usdt: amount, tx_hash: data.txHash || '' }
        });
        await fetchWallet();
      }
    } catch { /* non-blocking */ } finally {
      setAaveLoading(false);
    }
  };

  const handleAaveWithdraw = async (amount: number) => {
    setAaveLoading(true);
    try {
      const res = await fetch('/api/aave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw', amount })
      });
      const data = await res.json() as { success: boolean; txHash?: string };
      if (data.success) {
        setAaveBalance((b) => Math.max(0, b - amount));
        addActivity({
          type: 'aave_withdraw',
          title: 'Withdrew from Aave',
          description: `Withdrew ${amount.toFixed(2)} USDC from Aave yield vault`,
          metadata: { amount_usdt: amount, tx_hash: data.txHash || '' }
        });
        await fetchWallet();
      }
    } catch { /* non-blocking */ } finally {
      setAaveLoading(false);
    }
  };

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

  const startNewSession = () => {
    const nextSessionId = generateId('session');
    setCurrentSessionId(nextSessionId);
    setDraft(null);
    setInput('');
    setTyping(false);
    setSending(false);
    setFeeEth('');
    setPaymentExplanations([]);
    resetExecutionFlow();
    setMessages([]);
  };

  const getCurrentWalletId = () => {
    if (/^0x[a-fA-F0-9]{40}$/.test(wallet.address)) return wallet.address;
    const stored = storage.getWalletAddress();
    if (/^0x[a-fA-F0-9]{40}$/.test(stored)) return stored;
    return 'wdk_user';
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
    status: 'success' | 'failed';
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
        const walletId = /^0x[a-fA-F0-9]{40}$/.test(data.address) ? data.address : 'wdk_user';
        storage.setWalletAddress(walletId);
        setWallet({
          address: data.address,
          usdt_balance: data.usdt_balance,
          network: data.network,
          label: 'WDK Wallet'
        });
        await syncUserIdentity(walletId);
        await fetchPolicyFromApi(walletId);
        await fetchProductData(walletId);
      }
    } catch {
      setWallet((prev) => ({ ...prev, label: 'WDK Wallet' }));
    }
  };

  useEffect(() => {
    void fetchWallet();
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

  const executeDraftThroughPipeline = async (currentDraft: DraftPayment) => {
    setSending(true);

    try {
      // Auto-withdraw from Aave if liquid balance is insufficient
      const liquidBalance = Number(wallet.usdt_balance);
      if (currentDraft.amount_usdt > liquidBalance && aaveBalance > 0) {
        const needed = Number((currentDraft.amount_usdt - liquidBalance + 10).toFixed(2));
        const withdrawAmt = Math.min(needed, aaveBalance);
        setMessages((prev) => [...prev, agentMessage(`Withdrawing ${withdrawAmt.toFixed(2)} USDC from Aave yield vault to cover payment...`, 'system')]);
        try {
          const res = await fetch('/api/aave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'withdraw', amount: withdrawAmt })
          });
          const data = await res.json() as { success: boolean; txHash?: string };
          if (data.success) {
            setAaveBalance((b) => Math.max(0, b - withdrawAmt));
            addActivity({
              type: 'aave_withdraw',
              title: 'Withdrew from Aave for payment',
              description: `Withdrew ${withdrawAmt.toFixed(2)} USDC from Aave to cover payment`,
              metadata: { amount_usdt: withdrawAmt, tx_hash: data.txHash || '' }
            });
            await fetchWallet();
          }
        } catch { /* non-blocking, proceed with payment */ }
      }

      // Policy check
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
          metadata: { to_address: currentDraft.to_address, amount_usdt: currentDraft.amount_usdt, wallet_mode: 'wdk' }
        });
        setMessages((prev) => [...prev, agentMessage(`Execution blocked by policy\nTransaction rejected by policy engine. ${reason}`, 'system')]);

        return;
      }

      // Policy passed — run execution steps then immediately execute
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

      // Animate through steps 1-3, then execute
      await new Promise<void>((resolve) => {
        execFlowTimersRef.current = [
          window.setTimeout(() => setExecFlow((prev) => ({ ...prev, currentStep: 1 })), 500),
          window.setTimeout(() => setExecFlow((prev) => ({ ...prev, currentStep: 2 })), 1000),
          window.setTimeout(() => setExecFlow((prev) => ({ ...prev, currentStep: 3 })), 1500),
          window.setTimeout(() => setExecFlow((prev) => ({ ...prev, currentStep: 5 })), 2000),
          window.setTimeout(() => resolve(), 2100)
        ];
      });

      // Execute immediately — no confirmation step
      const sendResult = await executeApiPayment(currentDraft);
      if (sendResult.ok) {
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
      setMessages((prev) => [...prev, agentMessage(`Execution blocked by policy\nTransaction rejected by policy engine. ${reason}`, 'system')]);
    } finally {
      setSending(false);
    }
  };

  const onSendMessage = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;

    const nextUserMessage = userMessage(text);
    setMessages((prev) => [...prev, nextUserMessage]);
    setInput('');

    // Reset per-execution state — prevents stale policy/flow UI from previous run
    setPaymentExplanations([]);
    resetExecutionFlow();

    const lower = text.toLowerCase();

    // Detect single-step send intent: has both address and amount
    const isSendIntent = /\bsend\b/i.test(text) || /\bpay\b/i.test(text);
    const parsedAddress = parseAddress(text);
    const parsedAmount = parseAmount(text);

    if (isSendIntent && parsedAddress && parsedAmount > 0) {
      const memoMatch = text.match(/for\s+(.+)$/i);
      const memo = memoMatch ? memoMatch[1].trim() : undefined;
      const execDraft: DraftPayment = {
        to_address: parsedAddress,
        amount_usdt: parsedAmount,
        memo
      };
      setDraft(execDraft);
      await executeDraftThroughPipeline(execDraft);
      return;
    }

    // Detect send intent but missing data
    if (isSendIntent && (!parsedAddress || parsedAmount <= 0)) {
      setMessages((prev) => [...prev, agentMessage('Invalid transaction format', 'system')]);
      return;
    }

    if (['hi', 'hello', 'hey'].includes(lower)) {
      return;
    }

    if (lower === 'view invoices') {
      setTab('invoices');
      setMessages((prev) => [...prev, agentMessage('Invoice ledger opened.')]);
      return;
    }

    if (lower === 'check spending') {
      setTab('activity');
      setMessages((prev) => [...prev, agentMessage(`Spending summary: ${spentThisWeek.toFixed(2)} USDC in the last 7 days.`)]);
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
        setTyping(false);
        return;
      }

      // If agent returns a complete send draft, execute immediately
      if ((parsed.type === 'send' || parsed.type === 'update_draft') && parsed.draft?.to_address && parsed.draft?.amount_usdt) {
        setDraft(parsed.draft);
        setTyping(false);
        await executeDraftThroughPipeline(parsed.draft);
        return;
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
            description: `${schedule.label}: ${schedule.amount_usdt} USDC ${schedule.frequency}`,
            metadata: { schedule_id: schedule.id }
          });
          setMessages((prev) => [...prev, agentMessage(`Schedule registered: ${schedule.amount_usdt} USDC ${schedule.frequency} → ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`, 'system')]);
  
          setTyping(false);
          return;
        }

        if (/pause/i.test(text)) {
          const target = schedules.find((s) => text.toLowerCase().includes(s.label.toLowerCase().split(' ')[0]));
          if (target) {
            setSchedules((prev) => prev.map((s) => (s.id === target.id ? { ...s, paused: true } : s)));
            addActivity({
              type: 'schedule_paused',
              title: 'Schedule paused',
              description: `${target.label} paused`,
              metadata: { schedule_id: target.id }
            });
            setMessages((prev) => [...prev, agentMessage(`Schedule paused: ${target.label}`, 'system')]);
            setTyping(false);
            return;
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
            description: `${invoice.id} for ${invoice.amount_usdt} USDC`,
            metadata: { invoice_id: invoice.id }
          });
          setMessages((prev) => [...prev, agentMessage(`Invoice ${invoice.id} created — ${invoice.amount_usdt} USDC — ${invoice.description}`, 'system')]);
  
          setTyping(false);
          return;
        }
      }

      if (parsed.type === 'query' && /spent/i.test(lower)) {
        setMessages((prev) => [...prev, agentMessage(`${spentThisWeek.toFixed(2)} USDC spent in the last 7 days`, 'system')]);
        setTyping(false);
        return;
      }

      // Fallback: filter conversational filler
      const isFillerResponse = /i can help|please provide|what would you|let me know|sure|of course/i.test(parsed.message);
      if (!isFillerResponse && parsed.message) {
        setMessages((prev) => [...prev, agentMessage(parsed.message, 'system')]);
      } else {
        setMessages((prev) => [...prev, agentMessage('Invalid transaction format', 'system')]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        agentMessage(`Execution error: ${error instanceof Error ? error.message : 'unknown'}`, 'system')
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
      setMessages((prev) => [...prev, agentMessage(`Execution blocked by policy: ${data.error}`, 'system')]);
      return { ok: false, error: data.error || 'Unknown send failure' };
    }

    addActivity({
      type: 'payment_sent',
      title: 'USDC payment sent',
      description: `${currentDraft.amount_usdt} USDC sent to ${currentDraft.to_address}`,
      metadata: {
        to_address: currentDraft.to_address,
        amount_usdt: currentDraft.amount_usdt,
        tx_hash: data.tx_hash,
        memo: currentDraft.memo || '',
        wallet_mode: 'wdk'
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
        `Execution successful\nAll policy constraints satisfied before execution.`,
        'system',
        data.tx_hash
      )
    ]);

    if (isValidExplanation(data.explanation)) {
      setPaymentExplanations((prev) => [...prev, { id: generateId('exp'), explanation: data.explanation }]);
    }

    setDraft(null);
    await fetchWallet();
    return { ok: true, txHash: data.tx_hash };
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
        // Invoice status updated — reflected in sidebar, no chat message needed
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
          description: `${balance.toFixed(2)} USDC remaining, ${due24h.toFixed(2)} USDC due in next 24h`,
          metadata: { balance, due_24h: due24h }
        });

        setMessages((prev) => [
          ...prev,
          agentMessage(
            `Low balance: ${balance.toFixed(2)} USDC available — ${due24h.toFixed(2)} USDC due in 24h`,
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

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '28px 28px'
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 md:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-xl backdrop-blur-xl">
          <PaymanLogo size="sm" />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">WDK Wallet • Sepolia</p>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
              Live
            </span>
          </div>
          <p className="mt-1 break-all font-mono text-xs text-slate-200">
            {truncateAddress(wallet.address)}
          </p>          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">USDC Balance</p>
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
              onClick={fetchWallet}
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

          {/* Aave Yield Vault Panel */}
          <div className="mt-4 rounded-2xl border p-3.5" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,200,150,0.04))', borderColor: 'rgba(124,58,237,0.2)' }}>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-violet-400">Aave Yield Vault</p>
            <p className="mt-2 text-sm font-bold text-white">{aaveBalance.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDC deposited</span></p>
            <p className="mt-0.5 text-xs text-emerald-400">+{aaveYield.toFixed(4)} USDC yield earned</p>
            <p className="mt-0.5 text-[11px] text-slate-500">APY: ~4.2%</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => { void handleAaveDeposit(50); }}
                disabled={aaveLoading}
                className="flex-1 rounded-full border border-teal-400/40 bg-teal-400/10 px-2 py-1.5 text-xs text-teal-300 transition hover:bg-teal-400/20 disabled:opacity-50"
              >
                Deposit
              </button>
              <button
                onClick={() => { void handleAaveWithdraw(50); }}
                disabled={aaveLoading}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Withdraw
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Auto-deposit idle funds</span>
              <button
                type="button"
                onClick={() => {
                  const next = !autoAave;
                  setAutoAave(next);
                  localStorage.setItem('payman_auto_aave', JSON.stringify(next));
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full border transition ${autoAave ? 'border-violet-400/50 bg-violet-400/20' : 'border-white/10 bg-white/[0.06]'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full transition ${autoAave ? 'translate-x-4 bg-violet-400' : 'translate-x-0.5 bg-slate-400'}`} />
              </button>
            </div>
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

          <p className="mt-4 text-[10px] text-slate-600">Execution Engine v1.0 • Policy Layer Active</p>
        </aside>

        <main className="flex min-h-[80vh] flex-col rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl backdrop-blur-xl">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Execution Session Active</span>
            </div>
            <button
              onClick={startNewSession}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-400 transition hover:border-[#00c896]/40 hover:bg-[rgba(0,200,150,0.06)] hover:text-slate-200"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1v3.5L7 6M9 5A4 4 0 1 1 1 5a4 4 0 0 1 8 0Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              New Session
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6">
            {!messages.length && (
              <div className="w-full max-w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-600">Example commands</p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '12px',
                    width: '100%'
                  }}
                >
                  {PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => onSendMessage(prompt)}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        transition: 'all 0.2s ease'
                      }}
                      className="border border-white/[0.06] bg-white/[0.02] text-left font-mono text-xs text-slate-400 hover:border-[rgba(0,255,180,0.25)] hover:bg-[rgba(0,200,150,0.03)] hover:text-slate-300 hover:-translate-y-0.5"
                    >
                      {prompt}
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

            {typing && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-slate-500">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Evaluating</span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600" />
                </span>
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
                placeholder="Enter execution command — e.g. Send 20 USDC to 0x..."
                className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#00c896] focus:shadow-[0_0_0_3px_rgba(0,200,150,0.10)]"
              />
              <button
                onClick={() => onSendMessage()}
                disabled={!input.trim() || typing}
                className="rounded-full px-5 py-3 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50 [background:linear-gradient(135deg,#00c896,#00a878)]"
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
