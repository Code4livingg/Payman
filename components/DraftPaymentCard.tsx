import type { DraftPayment } from '@/lib/types';

export function DraftPaymentCard({ draft }: { draft: DraftPayment }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 text-sm text-slate-100">
      <p className="text-xs uppercase tracking-wider text-slate-400">Live Draft</p>
      <div className="mt-3 grid gap-1">
        <p>
          Recipient: <span className="font-mono text-slate-300">{draft.to_address || 'Pending'}</span>
        </p>
        <p>Amount: {draft.amount_usdt || 0} USDT</p>
        <p>Memo: {draft.memo?.trim() || 'Not set'}</p>
      </div>
    </div>
  );
}
