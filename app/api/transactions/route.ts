import { NextRequest, NextResponse } from 'next/server';
import { createTransaction, getTransactions, normalizeUserId } from '@/lib/server-persistence';

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');

  try {
    const transactions = await getTransactions(wallet);
    return NextResponse.json({ ok: true, transactions });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        transactions: [],
        userId: normalizeUserId(wallet),
        error: error instanceof Error ? error.message : 'Failed to fetch transactions'
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      wallet?: string;
      toAddress: string;
      amount: number;
      memo?: string;
      txHash: string;
      status: 'success' | 'failed';
    };

    const transaction = await createTransaction({
      userId: body.wallet || normalizeUserId(),
      toAddress: body.toAddress,
      amount: body.amount,
      memo: body.memo,
      txHash: body.txHash,
      status: body.status
    });

    return NextResponse.json({ ok: true, transaction });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to save transaction'
      },
      { status: 200 }
    );
  }
}
