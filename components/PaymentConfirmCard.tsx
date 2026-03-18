import type { DraftPayment } from '@/lib/types';

interface Props {
  draft: DraftPayment;
  feeEth?: string;
  sending: boolean;
  onConfirm: () => void;
}

export function PaymentConfirmCard({ draft, feeEth, sending, onConfirm }: Props) {
  return (
    <div className="rounded-[20px] border border-[#00c896]/25 bg-[rgba(0,200,150,0.06)] p-4 text-sm text-emerald-50">
      <p className="text-xs uppercase tracking-[0.14em] text-[#00c896]">Ready To Confirm</p>
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
        className="mt-4 w-full rounded-full bg-[#00c896] px-3 py-2 font-medium text-black transition hover:brightness-110 disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Confirm and Send'}
      </button>
    </div>
  );
}
