export type AgentIntentType =
  | 'send'
  | 'schedule'
  | 'invoice'
  | 'query'
  | 'chat'
  | 'update_draft'
  | 'cancel';

export type ChatRole = 'user' | 'agent' | 'system';

export type TabType = 'activity' | 'schedules' | 'invoices';

export interface DraftPayment {
  to_address: string;
  amount_usdt: number;
  memo?: string;
}

export interface AgentResponse {
  type: AgentIntentType;
  draft: DraftPayment | null;
  message: string;
  ready_to_confirm: boolean;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  timestamp: string;
}

export interface LocalTransaction {
  id: string;
  recipient: string;
  to_address: string;
  amount_usdt: number;
  status: 'success' | 'failed' | 'processing';
  timestamp: string;
  tx_hash?: string;
  failure_reason?: string;
}

export interface Policy {
  max_single_usdt: number;
  daily_cap_usdt: number;
  whitelist_enabled: boolean;
  whitelist: string[];
  block_duplicate_mins: number;
  require_memo: boolean;
}

export type ActivityType =
  | 'payment_sent'
  | 'payment_failed'
  | 'payment_blocked'
  | 'invoice_generated'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'schedule_executed'
  | 'schedule_failed'
  | 'schedule_paused'
  | 'low_balance_warning'
  | 'github_payment_released';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  timestamp: string;
  title: string;
  description: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface Schedule {
  id: string;
  to_address: string;
  amount_usdt: number;
  memo?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date?: string;
  last_run?: string;
  next_run: string;
  total_executed: number;
  max_executions?: number;
  paused: boolean;
  created_at: string;
  label: string;
}

export interface Invoice {
  id: string;
  issue_date: string;
  due_date: string;
  amount_usdt: number;
  description: string;
  recipient_wallet: string;
  status: 'pending' | 'paid' | 'overdue';
  paid_tx_hash?: string;
  paid_at?: string;
  created_at: string;
}

export interface WalletSendRequest {
  wallet?: string;
  to_address: string;
  amount_usdt: number;
  memo?: string;
  policy?: Policy;
  activity: ActivityItem[];
  mode?: 'send' | 'quote' | 'balance';
}

export interface WalletSendResult {
  ok: boolean;
  tx_hash?: string;
  explorer_url?: string;
  fee_eth?: string;
  from_address?: string;
  usdt_balance?: string;
  error?: string;
  fallback?: boolean;
}

export type TriggerType = 'manual_command' | 'schedule' | 'github_event';
export type CheckStatus = 'passed' | 'failed';
export type DecisionStatus = 'approved' | 'declined';

export interface ValidationCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}

export interface ValidationResult {
  approved: boolean;
  checks: ValidationCheck[];
}

export interface PaymentExplanation {
  trigger: TriggerType;
  summary: string;
  checks: Array<{
    label: string;
    status: CheckStatus;
  }>;
  decision: DecisionStatus;
  timestamp: string;
}
