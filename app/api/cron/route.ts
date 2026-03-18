import { NextRequest, NextResponse } from 'next/server';
import type { ActivityItem, Policy, Schedule } from '@/lib/types';
import { validateDraftAgainstPolicy } from '@/lib/policy';
import { computeNextRun } from '@/lib/utils';
import { sendUsdtTransfer } from '@/lib/wdk';

export async function GET(request: NextRequest) {
  try {
    const encoded = request.nextUrl.searchParams.get('payload');
    if (!encoded) {
      return NextResponse.json({ ok: true, executed: [], failed: [], note: 'No payload provided.' });
    }

    const parsed = JSON.parse(decodeURIComponent(encoded)) as {
      schedules: Schedule[];
      policy: Policy;
      activity: ActivityItem[];
    };

    const now = Date.now();
    const executed: Array<{ id: string; tx_hash: string }> = [];
    const failed: Array<{ id: string; reason: string }> = [];
    const updatedSchedules = [...parsed.schedules];

    for (const schedule of updatedSchedules) {
      if (schedule.paused) continue;
      if (new Date(schedule.next_run).getTime() > now) continue;
      if (schedule.end_date && new Date(schedule.end_date).getTime() < now) continue;
      if (schedule.max_executions && schedule.total_executed >= schedule.max_executions) continue;

      const guard = validateDraftAgainstPolicy(
        {
          to_address: schedule.to_address,
          amount_usdt: schedule.amount_usdt,
          memo: schedule.memo
        },
        parsed.policy,
        parsed.activity
      );

      if (!guard.ok) {
        failed.push({ id: schedule.id, reason: guard.reason || 'Policy blocked' });
        continue;
      }

      try {
        const tx = await sendUsdtTransfer(schedule.to_address, schedule.amount_usdt, schedule.memo);
        schedule.last_run = new Date().toISOString();
        schedule.next_run = computeNextRun(schedule.frequency, schedule.last_run);
        schedule.total_executed += 1;
        executed.push({ id: schedule.id, tx_hash: tx.txHash });
      } catch (error) {
        failed.push({ id: schedule.id, reason: error instanceof Error ? error.message : 'Execution failed' });
      }
    }

    return NextResponse.json({ ok: true, executed, failed, schedules: updatedSchedules });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Cron processing failed'
      },
      { status: 500 }
    );
  }
}
