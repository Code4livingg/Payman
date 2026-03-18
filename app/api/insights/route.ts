import { NextRequest, NextResponse } from 'next/server';
import { getInsights, normalizeUserId } from '@/lib/server-persistence';

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');

  try {
    const insights = await getInsights(wallet);
    return NextResponse.json({ ok: true, insights });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        insights: {
          totalSpent: 0,
          last7DaysSpend: 0,
          transactionCount: 0
        },
        userId: normalizeUserId(wallet),
        error: error instanceof Error ? error.message : 'Failed to compute insights'
      },
      { status: 200 }
    );
  }
}
