import type { DraftPayment } from '@/lib/types';

interface Props {
  draft: DraftPayment;
  feeEth?: string;
  sending: boolean;
  onConfirm: () => void;
}

export function PaymentConfirmCard({ draft, feeEth, sending, onConfirm }: Props) {
  return (
    <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-50">
      <p className="text-xs uppercase tracking-wider text-emerald-300">Ready To Confirm</p>
      <div className="mt-3 grid gap-1">
        <p>Recipient: <span className="font-mono">{draft.to_address}</span></p>
        <p>Amount: {draft.amount_usdt} USDT</p>
        <p>Network: Sepolia</p>
        <p>Memo: {draft.memo || 'N/A'}</p>
        <p>Estimated fee: {feeEth || 'Estimating...'} ETH</p>
      </div>
      <button
        onClick={onConfirm}
        disabled={sending}
        className="mt-4 w-full rounded-lg bg-emerald-500 px-3 py-2 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Confirm and Send'}
      </button>
    </div>
  );
}
