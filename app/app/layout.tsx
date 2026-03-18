'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FileText, History, Receipt, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymanLogo } from '@/components/PaymanLogo';

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
    <div className="min-h-screen bg-[#050508] p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[220px_1fr]">
        <aside className="flex min-h-[86vh] flex-col rounded-2xl border border-white/10 bg-[#0a0a0f] p-3 shadow-xl backdrop-blur">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <PaymanLogo size="sm" />
            <p className="mt-1 text-[11px] text-slate-500">v2.6-alpha</p>
          </div>
          <Link
            href="/"
            className="mb-3 inline-flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.04]"
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
                    'flex items-center gap-2 rounded-full px-3 py-2 text-sm transition',
                    active ? 'bg-[#00c896] text-black' : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="font-mono text-xs text-slate-400">0x742d...f44e</p>
            <p className="mt-2 inline-flex items-center gap-2 text-xs text-[#00c896]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00c896] animate-[pulse_2s_ease-in-out_infinite]" />
              Connected
            </p>
          </div>
        </aside>

        <section key={pathname} className="animate-page-enter">
          <header className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 shadow-lg backdrop-blur-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#00c896]">Payman Workspace</p>
              <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00c896]/30 bg-white/[0.03] px-2.5 py-1 text-[#00c896]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00c896] animate-[pulse_2s_ease-in-out_infinite]" />
                Policy Engine Active
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-white/[0.03] px-2.5 py-1 text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-[pulse_2s_ease-in-out_infinite]" />
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
