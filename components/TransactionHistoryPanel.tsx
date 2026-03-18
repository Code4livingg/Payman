import { formatDate } from '@/lib/utils';

interface TransactionRow {
  id: string;
  toAddress: string;
  amount: number;
  txHash: string;
  status: string;
  createdAt: string;
}

export function TransactionHistoryPanel({ transactions }: { transactions: TransactionRow[] }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-xs uppercase tracking-wider text-slate-400">Transaction History</p>
      {!transactions.length ? (
        <p className="mt-2 text-xs text-slate-500">No transactions found.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {transactions.slice(0, 8).map((tx) => (
            <div key={tx.id} className="rounded-md border border-slate-800 bg-slate-950/60 p-2 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-200">{tx.amount.toFixed(2)} USDT</p>
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    tx.status === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : tx.status === 'demo'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
              <p className="mt-1 font-mono text-slate-400">{tx.toAddress}</p>
              <p className="text-slate-500">{formatDate(tx.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
