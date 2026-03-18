import { NextRequest, NextResponse } from 'next/server';
import { evaluatePaymentValidation, validateDraftAgainstPolicy } from '@/lib/policy';
import { getNetworkLabel, getWalletSnapshot, quoteUsdtTransfer, sendUsdtTransfer } from '@/lib/wdk';
import type { WalletSendRequest } from '@/lib/types';
import { generateExplanation } from '@/lib/explainer';
import { createTransaction, defaultPolicy, getOrCreatePolicy, normalizeUserId } from '@/lib/server-persistence';

export async function GET() {
  try {
    const snapshot = await getWalletSnapshot();
    return NextResponse.json({
      ok: true,
      address: snapshot.address,
      usdt_balance: snapshot.usdtBalance,
      demo: snapshot.demo,
      network: getNetworkLabel()
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load wallet info'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WalletSendRequest;
    const mode = body.mode || 'send';

    if (!body.to_address || !body.amount_usdt) {
      return NextResponse.json({ ok: false, error: 'Missing required send payload' }, { status: 400 });
    }

    const userId = normalizeUserId((body as WalletSendRequest & { wallet?: string }).wallet);
    let effectivePolicy = body.policy || defaultPolicy();
    try {
      effectivePolicy = await getOrCreatePolicy(userId);
    } catch {
      // DB unavailable, continue with incoming or default local policy
    }

    const draft = {
      to_address: body.to_address,
      amount_usdt: body.amount_usdt,
      memo: body.memo
    };
    const validationResults = evaluatePaymentValidation(draft, effectivePolicy, body.activity || []);
    const policyCheck = validateDraftAgainstPolicy(draft, effectivePolicy, body.activity || []);

    if (!policyCheck.ok) {
      return NextResponse.json({ ok: false, error: policyCheck.reason }, { status: 400 });
    }

    const quote = await quoteUsdtTransfer(body.to_address, body.amount_usdt);
    if (mode === 'quote') {
      return NextResponse.json({
        ok: true,
        fee_eth: quote.feeEth,
        network: getNetworkLabel(),
        demo: quote.demo
      });
    }

    const result = await sendUsdtTransfer(body.to_address, body.amount_usdt, body.memo);
    const explanation = generateExplanation({
      triggerType: 'manual_command',
      policy: effectivePolicy,
      draft,
      validationResults
    });

    try {
      await createTransaction({
        userId,
        toAddress: body.to_address,
        amount: body.amount_usdt,
        memo: body.memo,
        txHash: result.txHash,
        status: result.demo ? 'demo' : 'success'
      });
    } catch {
      // DB failure should not block payment flow
    }

    return NextResponse.json({
      success: true,
      ok: true,
      txHash: result.txHash,
      tx_hash: result.txHash,
      explorerUrl: result.explorerUrl,
      explorer_url: result.explorerUrl,
      fee_eth: result.feeEth,
      from_address: result.fromAddress,
      network: getNetworkLabel(),
      fallback: result.demo,
      explanation
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Transfer failed'
      },
      { status: 500 }
    );
  }
}
