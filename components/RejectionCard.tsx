'use client';

export type RejectionReason =
  | 'amount_exceeded'
  | 'daily_cap_reached'
  | 'whitelist_violation'
  | 'missing_memo'
  | 'duplicate_payment'
  | 'invalid_address';

interface RejectionCardProps {
  reason: RejectionReason;
  attempted: number;
  limit: number | string;
  ruleText?: string;
  fixText?: string;
  onEditAmount: () => void;
  onOpenSettings: () => void;
}

const CONTENT: Record<RejectionReason, { rule: (attempted: number, limit: number | string) => string; fix: string }> = {
  amount_exceeded: {
    rule: (attempted, limit) => `Amount ${attempted} USDT exceeds single limit of ${limit} USDT`,
    fix: 'Reduce the amount to fit the single-payment limit or raise the limit in Settings.'
  },
  daily_cap_reached: {
    rule: (attempted, limit) => `Daily cap of ${limit} USDT reached. ${attempted} USDT spent today`,
    fix: 'Wait for the daily window to reset or increase the daily cap in Settings.'
  },
  whitelist_violation: {
    rule: () => 'Recipient not in approved whitelist',
    fix: 'Send to an approved address or update the whitelist in Settings.'
  },
  missing_memo: {
    rule: () => 'This payment requires a justification memo',
    fix: 'Add a memo explaining the payment, then try again.'
  },
  duplicate_payment: {
    rule: (_attempted, limit) => `Duplicate payment blocked within ${limit} minutes`,
    fix: 'Wait for the duplicate-protection window to expire or adjust it in Settings.'
  },
  invalid_address: {
    rule: () => 'Not a valid Ethereum address',
    fix: 'Replace the recipient with a valid Ethereum address before sending.'
  }
};

export function RejectionCard({
  reason,
  attempted,
  limit,
  ruleText,
  fixText,
  onEditAmount,
  onOpenSettings
}: RejectionCardProps) {
  const content = CONTENT[reason];

  return (
    <div className="rounded-[20px] border border-white/10 border-l-[3px] border-l-[#ef4444] bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.82))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <p className="font-mono text-lg font-bold text-red-400">✗ Transaction Blocked</p>
      <p className="mt-1 font-mono text-xs text-slate-400">Policy violation detected</p>

      <div className="my-4 h-px bg-white/10" />

      <div className="space-y-4 font-mono text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Rule violated:</p>
          <p className="mt-1 text-red-200">{ruleText || content.rule(attempted, limit)}</p>
        </div>

        <div className="space-y-2 text-slate-300">
          <p>Attempted: {attempted} USDT</p>
          <p>Limit: {typeof limit === 'number' ? `${limit} USDT` : limit}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">To fix:</p>
          <p className="mt-1 text-slate-200">{fixText || content.fix}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={onEditAmount}
          className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-xs text-red-200 transition hover:bg-red-500/20"
        >
          Edit Amount
        </button>
        <button
          onClick={onOpenSettings}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-xs text-slate-200 transition hover:border-red-400/30 hover:bg-white/[0.06]"
        >
          Open Settings
        </button>
      </div>
    </div>
  );
}
