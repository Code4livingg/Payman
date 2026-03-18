'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import type { Invoice } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const saved = storage.getInvoices();
    if (saved.length) {
      setInvoices(saved);
      return;
    }

    setInvoices([
      {
        id: 'INV-1842',
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        amount_usdt: 420,
        description: 'Design system sprint',
        recipient_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 'INV-2198',
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        amount_usdt: 860,
        description: 'Smart contract audit',
        recipient_wallet: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        status: 'paid',
        created_at: new Date().toISOString(),
        paid_tx_hash: '0xabc123',
        paid_at: new Date().toISOString()
      }
    ]);
  }, []);

  return (
    <main className="rounded-2xl border border-slate-800 bg-panel/80 p-5 shadow-xl backdrop-blur">
      <h1 className="text-xl font-semibold text-slate-100">Invoices</h1>
      <p className="mt-1 text-sm text-slate-400">Track generated invoices and settlement state.</p>

      <div className="mt-5 space-y-2">
        {invoices.map((invoice) => (
          <article key={invoice.id} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-100">{invoice.id}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : invoice.status === 'overdue'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-200">{invoice.amount_usdt.toFixed(2)} USDT</p>
            <p className="text-xs text-slate-400">Due: {formatDate(invoice.due_date)}</p>
            <div className="mt-3">
              <Link href={`/invoice/${invoice.id}`} className="text-xs text-emerald-300 hover:text-emerald-200">
                Open invoice
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
