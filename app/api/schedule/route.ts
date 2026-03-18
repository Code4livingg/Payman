import { NextRequest, NextResponse } from 'next/server';
import { computeNextRun, generateId } from '@/lib/utils';
import type { Schedule } from '@/lib/types';

declare global {
  // eslint-disable-next-line no-var
  var __paymanSchedules: Schedule[] | undefined;
}

function store(): Schedule[] {
  if (!global.__paymanSchedules) global.__paymanSchedules = [];
  return global.__paymanSchedules;
}

export async function GET() {
  return NextResponse.json({ ok: true, schedules: store() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const schedules = store();

  if (body.action === 'create') {
    const now = new Date().toISOString();
    const frequency = body.frequency as Schedule['frequency'];
    const schedule: Schedule = {
      id: generateId('sch'),
      to_address: body.to_address,
      amount_usdt: Number(body.amount_usdt),
      memo: body.memo,
      frequency,
      start_date: body.start_date || now,
      end_date: body.end_date,
      last_run: undefined,
      next_run: body.start_date || computeNextRun(frequency, now),
      total_executed: 0,
      max_executions: body.max_executions,
      paused: false,
      created_at: now,
      label: body.label || 'Scheduled payment'
    };

    schedules.unshift(schedule);
    return NextResponse.json({ ok: true, schedule });
  }

  if (body.action === 'toggle_pause') {
    const target = schedules.find((item) => item.id === body.id);
    if (!target) return NextResponse.json({ ok: false, error: 'Schedule not found' }, { status: 404 });
    target.paused = !target.paused;
    return NextResponse.json({ ok: true, schedule: target });
  }

  if (body.action === 'delete') {
    const idx = schedules.findIndex((item) => item.id === body.id);
    if (idx === -1) return NextResponse.json({ ok: false, error: 'Schedule not found' }, { status: 404 });
    const removed = schedules.splice(idx, 1);
    return NextResponse.json({ ok: true, schedule: removed[0] });
  }

  return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400 });
}
