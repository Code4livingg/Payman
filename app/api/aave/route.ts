import { NextRequest, NextResponse } from 'next/server';
import { depositToAave, getAaveBalance, getYieldEarned, withdrawFromAave } from '@/lib/aave';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action: 'deposit' | 'withdraw' | 'balance' | 'yield'; amount?: number };
    const { action, amount } = body;

    if (action === 'balance') {
      const result = await getAaveBalance();
      return NextResponse.json({ success: true, aaveBalance: result.aaveBalance, isDemoMode: result.isDemoMode });
    }

    if (action === 'yield') {
      const result = await getYieldEarned();
      return NextResponse.json({ success: true, yield: result.yieldEarned, apy: result.apy, isDemoMode: result.isDemoMode });
    }

    if (action === 'deposit') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid deposit amount' }, { status: 400 });
      }
      const result = await depositToAave(amount);
      return NextResponse.json({ success: true, txHash: result.txHash, isDemoMode: result.isDemoMode });
    }

    if (action === 'withdraw') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid withdraw amount' }, { status: 400 });
      }
      const result = await withdrawFromAave(amount);
      return NextResponse.json({ success: true, txHash: result.txHash, isDemoMode: result.isDemoMode });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Aave operation failed' },
      { status: 500 }
    );
  }
}
