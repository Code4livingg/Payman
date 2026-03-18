import type { Schedule } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface Props {
  schedules: Schedule[];
  onTogglePause: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SchedulesList({ schedules, onTogglePause, onDelete }: Props) {
  if (!schedules.length) {
    return <p className="text-sm text-slate-400">No schedules created.</p>;
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <div key={schedule.id} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium text-slate-100">{schedule.label}</p>
            <span className={`text-xs ${schedule.paused ? 'text-amber-300' : 'text-emerald-300'}`}>
              {schedule.paused ? 'Paused' : 'Active'}
            </span>
          </div>
          <p className="mt-2 text-slate-300">
            {schedule.amount_usdt} USDT to <span className="font-mono">{schedule.to_address}</span>
          </p>
          <p className="text-xs text-slate-400">Next run: {formatDate(schedule.next_run)}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onTogglePause(schedule.id)}
              className="rounded-md border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800"
            >
              {schedule.paused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={() => onDelete(schedule.id)}
              className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
