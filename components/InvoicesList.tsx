import Link from 'next/link';
import type { Invoice } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  if (!invoices.length) {
    return <p className="text-sm text-slate-400">No invoices generated yet.</p>;
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium text-slate-100">{invoice.id}</p>
            <span
              className={`text-xs ${
                invoice.status === 'paid'
                  ? 'text-emerald-300'
                  : invoice.status === 'overdue'
                    ? 'text-amber-300'
                    : 'text-slate-300'
              }`}
            >
              {invoice.status}
            </span>
          </div>
          <p className="mt-1 text-slate-300">{invoice.amount_usdt} USDC - {invoice.description}</p>
          <p className="text-xs text-slate-400">Due: {formatDate(invoice.due_date)}</p>
          <Link href={`/invoice/${invoice.id}`} className="mt-2 inline-flex text-xs text-emerald-300 hover:text-emerald-200">
            Open invoice
          </Link>
        </div>
      ))}
    </div>
  );
}
