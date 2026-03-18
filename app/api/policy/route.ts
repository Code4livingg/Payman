import { NextRequest, NextResponse } from 'next/server';
import { defaultPolicy, getOrCreatePolicy, normalizeUserId, updatePolicy } from '@/lib/server-persistence';
import type { Policy } from '@/lib/types';

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  try {
    const policy = await getOrCreatePolicy(wallet);
    return NextResponse.json({ ok: true, policy });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        policy: defaultPolicy(),
        userId: normalizeUserId(wallet),
        error: error instanceof Error ? error.message : 'Failed to fetch policy'
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      wallet?: string;
      policy: Partial<Policy>;
    };

    const policy = await updatePolicy(body.wallet, body.policy || {});
    return NextResponse.json({ ok: true, policy });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        policy: defaultPolicy(),
        error: error instanceof Error ? error.message : 'Failed to update policy'
      },
      { status: 200 }
    );
  }
}
