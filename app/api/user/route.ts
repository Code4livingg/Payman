import { NextRequest, NextResponse } from 'next/server';
import { ensureUser, normalizeUserId } from '@/lib/server-persistence';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { wallet?: string };
    const userId = await ensureUser(body.wallet);
    return NextResponse.json({ ok: true, userId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        userId: normalizeUserId(),
        error: error instanceof Error ? error.message : 'Failed to upsert user'
      },
      { status: 200 }
    );
  }
}
