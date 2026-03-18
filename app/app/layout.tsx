'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FileText, History, Receipt, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/app', label: 'Chat', icon: Bot },
  { href: '/app/transactions', label: 'Transactions', icon: Wallet },
  { href: '/app/invoices', label: 'Invoices', icon: Receipt },
  { href: '/app/history', label: 'History', icon: History }
];

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = NAV_ITEMS.find((item) => item.href === pathname)?.label || 'System';

  return (
    <div className="min-h-screen bg-[#030712] p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 shadow-xl backdrop-blur">
          <Link
            href="/"
            className="mb-3 inline-flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
          >
            <FileText className="h-4 w-4" />
            Back to Home
          </Link>

          <p className="mb-2 px-2 text-xs uppercase tracking-[0.16em] text-slate-500">Workspace</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                    active ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section key={pathname} className="animate-page-enter">
          <header className="mb-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/75 px-4 py-3 shadow-lg">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Payman Workspace</p>
              <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-[livePulse_2.2s_ease-in-out_infinite]" />
                Policy Engine Active
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-[livePulse_2.2s_ease-in-out_infinite]" />
                Execution Layer Connected
              </div>
            </div>
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
