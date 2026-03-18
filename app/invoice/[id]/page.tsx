'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Invoice } from '@/lib/types';
import { storage } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { PaymanLogo } from '@/components/PaymanLogo';

export default function InvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const found = storage.getInvoices().find((item) => item.id === params.id) || null;
    setInvoice(found);
  }, [params.id]);

  const payUrl = useMemo(() => {
    if (!invoice) return '/app';
    const cmd = encodeURIComponent(
      `Send ${invoice.amount_usdt} USDT to ${invoice.recipient_wallet} for invoice ${invoice.id}`
    );
    return `/app?prefill=${cmd}`;
  }, [invoice]);

  if (!invoice) {
    return (
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
          <p className="text-slate-300">Invoice not found.</p>
          <Link href="/app" className="mt-3 inline-flex text-sm text-emerald-300">Back to app</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-950/70 p-8">
        <div className="mb-2">
          <PaymanLogo size="md" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Payman Invoice</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{invoice.id}</h1>

        <div className="mt-8 grid gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm md:grid-cols-2">
          <p className="text-slate-300">Amount: <span className="text-emerald-300">{invoice.amount_usdt} USDT</span></p>
          <p className="text-slate-300">Status: <span className="capitalize">{invoice.status}</span></p>
          <p className="text-slate-300">Issue date: {formatDate(invoice.issue_date)}</p>
          <p className="text-slate-300">Due date: {formatDate(invoice.due_date)}</p>
          <p className="text-slate-300 md:col-span-2">Description: {invoice.description}</p>
          <p className="break-all text-slate-300 md:col-span-2">Recipient wallet: {invoice.recipient_wallet}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={payUrl} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400">
            Pay Now
          </Link>
          <Link href="/app" className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900">
            Open Payman
          </Link>
        </div>
      </div>
    </main>
  );
}
