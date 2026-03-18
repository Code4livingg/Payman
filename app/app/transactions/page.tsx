'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import type { LocalTransaction } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);

  useEffect(() => {
    setTransactions(storage.getLocalTransactions());
  }, []);

  return (
    <main className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl backdrop-blur-xl">
      <h1 className="text-xl font-semibold text-slate-100">Transactions</h1>
      <p className="mt-1 text-sm text-slate-400">Tracked payment outcomes across demo and live flows.</p>

      <div className="mt-5 space-y-2">
        {!transactions.length && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border border-white/10 bg-white/[0.03]" />
            <p className="text-sm font-medium text-slate-200">No executions yet</p>
            <p className="mt-1 text-xs text-slate-500">Your first transaction will appear here.</p>
          </div>
        )}
        {transactions.map((tx) => (
          <article key={tx.id} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 transition duration-200 hover:border-slate-600">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-100">{tx.recipient}</p>
                <p className="break-all font-mono text-xs text-slate-400">{tx.to_address}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  tx.status === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : tx.status === 'failed'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {tx.status === 'processing' ? 'pending' : tx.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span>{tx.amount_usdt.toFixed(2)} USDT</span>
              <span>{formatDate(tx.timestamp)}</span>
            </div>
            {tx.failure_reason ? <p className="mt-2 text-xs text-red-300">Failure reason: {tx.failure_reason}</p> : null}
          </article>
        ))}
      </div>
    </main>
  );
}
