'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import type { LocalTransaction } from '@/lib/types';
import { formatDate, timeAgo, shortenHash } from '@/lib/utils';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    setTransactions(storage.getLocalTransactions());
    // re-render every 30s to keep relative times fresh
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl backdrop-blur-xl">
      <h1 className="text-xl font-semibold text-slate-100">Transactions</h1>
      <p className="mt-1 text-sm text-slate-400">Tracked payment outcomes across all execution flows.</p>

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
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  tx.status === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                    : tx.status === 'failed'
                      ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30'
                }`}
              >
                {tx.status === 'processing' ? 'pending' : tx.status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span>{tx.amount_usdt.toFixed(2)} USDC</span>
              <span title={formatDate(tx.timestamp)} className="text-slate-500">
                {timeAgo(tx.timestamp)}
              </span>
              <span className="text-slate-600">{formatDate(tx.timestamp)}</span>
            </div>

            {tx.tx_hash && (
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-500">{shortenHash(tx.tx_hash)}</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${tx.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 transition hover:border-emerald-400/50 hover:bg-emerald-500/20"
                >
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  View on Explorer
                </a>
              </div>
            )}

            {tx.failure_reason ? <p className="mt-2 text-xs text-red-300">Failure reason: {tx.failure_reason}</p> : null}
          </article>
        ))}
      </div>
    </main>
  );
}
