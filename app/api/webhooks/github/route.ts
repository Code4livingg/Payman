import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function verifySignature(secret: string, body: string, signature: string | null) {
  if (!signature) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'Missing GITHUB_WEBHOOK_SECRET' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!verifySignature(secret, rawBody, signature)) {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  if (event !== 'pull_request') {
    return NextResponse.json({ ok: true, ignored: true, reason: 'Unsupported event type' });
  }

  const payload = JSON.parse(rawBody) as {
    action: string;
    pull_request?: { merged?: boolean; title?: string };
    repository?: { name?: string };
    schedules?: Array<{ id: string; label?: string; amount_usdt?: number; to_address?: string }>;
  };

  const isMerged = payload.action === 'closed' && payload.pull_request?.merged;
  if (!isMerged) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'PR not merged' });
  }

  const repo = payload.repository?.name?.toLowerCase() || '';
  const matchedSchedule =
    payload.schedules?.find((schedule) => schedule.label?.toLowerCase().includes(repo)) || null;

  return NextResponse.json({
    ok: true,
    event: 'github_payment_released',
    message: matchedSchedule
      ? `PR merged in ${payload.repository?.name || 'repo'} — sent ${matchedSchedule.amount_usdt || 'X'} USDT to ${matchedSchedule.to_address || '0x...'}`
      : `PR merged in ${payload.repository?.name || 'repo'} — sent X USDT to 0x... (demo trigger).`,
    metadata: {
      repo: payload.repository?.name || 'unknown',
      pr_title: payload.pull_request?.title || '',
      matched_schedule_id: matchedSchedule?.id || null
    }
  });
}
