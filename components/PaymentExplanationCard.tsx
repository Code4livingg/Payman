import { CheckCircle2, XCircle } from 'lucide-react';
import type { PaymentExplanation } from '@/lib/types';
import { formatDate } from '@/lib/utils';

function toTitleCase(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function PaymentExplanationCard({ explanation }: { explanation: PaymentExplanation }) {
  if (!explanation || !Array.isArray(explanation.checks)) return null;

  return (
    <div className="flex w-full justify-start">
      <div className="animate-fade-up rounded-2xl border border-emerald-400/30 bg-slate-900/90 p-4 shadow-lg shadow-emerald-900/20 md:max-w-[75%]">
        <h3 className="text-sm font-semibold text-slate-100">Why this payment was executed</h3>

        <div className="mt-4 grid gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Trigger</p>
            <p className="mt-1 text-slate-100">{toTitleCase(explanation.trigger)}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Checks</p>
            <ul className="mt-2 space-y-2">
              {explanation.checks.map((check, idx) => {
                const passed = check.status === 'passed';
                const Icon = passed ? CheckCircle2 : XCircle;
                return (
                  <li key={`${check.label}-${idx}`} className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${passed ? 'text-emerald-400' : 'text-red-400'}`} />
                    <span className="text-slate-200">{check.label}</span>
                    <span className={`ml-auto text-xs ${passed ? 'text-emerald-300' : 'text-red-300'}`}>
                      {passed ? 'Passed' : 'Failed'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Decision</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  explanation.decision === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
                }`}
              >
                {toTitleCase(explanation.decision)}
              </span>
            </div>
            <p className="text-xs text-slate-500">{formatDate(explanation.timestamp)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
