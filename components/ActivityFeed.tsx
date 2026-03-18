import {
  AlertTriangle,
  ArrowRightLeft,
  BadgeDollarSign,
  CalendarSync,
  CheckCircle,
  CircleDashed,
  Github,
  XCircle
} from 'lucide-react';
import type { ActivityItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const config = {
  payment_sent: { icon: CheckCircle, className: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' },
  payment_failed: { icon: XCircle, className: 'text-red-300 border-red-400/30 bg-red-500/10' },
  payment_blocked: { icon: AlertTriangle, className: 'text-amber-300 border-amber-400/30 bg-amber-500/10' },
  invoice_generated: { icon: BadgeDollarSign, className: 'text-slate-200 border-slate-600 bg-slate-700/20' },
  invoice_paid: { icon: CheckCircle, className: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' },
  invoice_overdue: { icon: AlertTriangle, className: 'text-amber-300 border-amber-400/30 bg-amber-500/10' },
  schedule_executed: { icon: CalendarSync, className: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' },
  schedule_failed: { icon: XCircle, className: 'text-red-300 border-red-400/30 bg-red-500/10' },
  schedule_paused: { icon: CircleDashed, className: 'text-amber-300 border-amber-400/30 bg-amber-500/10' },
  low_balance_warning: { icon: AlertTriangle, className: 'text-amber-300 border-amber-400/30 bg-amber-500/10' },
  github_payment_released: { icon: Github, className: 'text-slate-200 border-slate-600 bg-slate-700/20' }
} as const;

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-400">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const meta = config[item.type];
        const Icon = meta?.icon || ArrowRightLeft;
        return (
          <div key={item.id} className={`rounded-lg border p-3 ${meta?.className || 'border-slate-700 bg-slate-800/40'}`}>
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4" />
              <div>
                <p className="text-sm font-medium text-slate-100">{item.title}</p>
                <p className="text-xs text-slate-300">{item.description}</p>
                <p className="mt-1 text-[11px] text-slate-400">{formatDate(item.timestamp)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
