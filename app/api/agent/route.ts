import { NextRequest, NextResponse } from 'next/server';
import { runClaudeParser } from '@/lib/claude';
import type { AgentResponse, DraftPayment } from '@/lib/types';

// Strict ETH address: must be exactly 0x + 40 hex chars, not part of a longer hex string
const ETH_ADDRESS_REGEX = /(?<![a-fA-F0-9])0x[a-fA-F0-9]{40}(?![a-fA-F0-9])/;
const AMOUNT_REGEX = /(\d+(?:\.\d+)?)\s*usd[ct]?/i;

function normalizeAddress(raw: string | null | undefined): string {
  // Lowercase before validation — ethers v6 rejects non-EIP55-checksummed mixed-case addresses
  return (raw ?? '').trim().replace(/[\r\n\t]/g, '').toLowerCase();
}

function fallbackResponse(message: string): AgentResponse {
  return {
    type: 'chat',
    draft: null,
    message,
    ready_to_confirm: false
  };
}

function parseRuleBased(input: string, draft: DraftPayment | null): AgentResponse {
  const lower = input.toLowerCase().trim();

  if (lower === 'cancel' || lower.includes('cancel payment')) {
    return {
      type: 'cancel',
      draft: null,
      message: 'Canceled. I cleared your draft payment.',
      ready_to_confirm: false
    };
  }

  const memoMatch = lower.match(/(?:memo|note)\s*:\s*(.+)$/i);
  if (memoMatch && draft) {
    const updated: DraftPayment = { ...draft, memo: memoMatch[1].trim() };
    return {
      type: 'update_draft',
      draft: updated,
      message: `Memo added. Draft is ${updated.amount_usdt} USDT to ${updated.to_address}. Confirm when ready.`,
      ready_to_confirm: true
    };
  }

  const amountUpdate = lower.match(/(?:make it|change amount to|update amount to)\s*(\d+(?:\.\d+)?)/i);
  if (amountUpdate && draft) {
    const updated: DraftPayment = {
      ...draft,
      amount_usdt: Number(amountUpdate[1])
    };
    return {
      type: 'update_draft',
      draft: updated,
      message: `Updated amount to ${updated.amount_usdt} USDT. ${updated.memo ? 'Ready to confirm.' : 'Add memo or confirm.'}`,
      ready_to_confirm: Boolean(updated.memo)
    };
  }

  const hasSendIntent = /(send|pay|transfer)/i.test(lower);
  const amount = AMOUNT_REGEX.exec(lower);
  const address = ETH_ADDRESS_REGEX.exec(input);
  const cleanAddress = address ? normalizeAddress(address[0]) : null;

  console.log('Parsed address:', cleanAddress);

  if (hasSendIntent && (amount || cleanAddress || draft)) {
    const nextDraft: DraftPayment = {
      to_address: cleanAddress || draft?.to_address || '',
      amount_usdt: amount ? Number(amount[1]) : draft?.amount_usdt || 0,
      memo: draft?.memo
    };

    const inlineMemo = lower.match(/for\s+(.+)$/i);
    if (inlineMemo && !nextDraft.memo) nextDraft.memo = inlineMemo[1].trim();

    const complete = Boolean(nextDraft.to_address && nextDraft.amount_usdt > 0);
    const ready = complete && Boolean(nextDraft.memo);

    return {
      type: draft ? 'update_draft' : 'send',
      draft: nextDraft,
      message: ready
        ? `Draft ready: ${nextDraft.amount_usdt} USDT to ${nextDraft.to_address} with memo "${nextDraft.memo}". Please confirm.`
        : complete
          ? `Draft ready with recipient and amount. Add memo (optional unless policy requires) then confirm.`
          : 'I started your payment draft. Please provide amount and recipient address.',
      ready_to_confirm: ready
    };
  }

  if (/every\s+(day|daily|week|weekly|month|monthly|friday|monday|tuesday|wednesday|thursday|saturday|sunday)/i.test(lower)) {
    return {
      type: 'schedule',
      draft,
      message: 'I can create that schedule. I parsed this as a recurring payment request.',
      ready_to_confirm: false
    };
  }

  if (/invoice|bill|charge/i.test(lower)) {
    return {
      type: 'invoice',
      draft,
      message: 'I parsed this as an invoice request. I can generate a shareable invoice now.',
      ready_to_confirm: false
    };
  }

  if (/how much|spent|balance|history/i.test(lower)) {
    return {
      type: 'query',
      draft,
      message: 'I parsed this as a spending or balance query.',
      ready_to_confirm: false
    };
  }

  return fallbackResponse('I can help with sending USDT, schedules, invoices, and spending summaries.');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body.message ?? '');
    const draft = (body.draft as DraftPayment | null) ?? null;

    if (!message.trim()) {
      return NextResponse.json(fallbackResponse('Please enter a message.'));
    }

    const claude = await runClaudeParser(message, draft);
    if (claude) {
      return NextResponse.json(claude);
    }

    return NextResponse.json(parseRuleBased(message, draft));
  } catch (error) {
    return NextResponse.json(
      fallbackResponse(`Parser error: ${error instanceof Error ? error.message : 'unknown error'}`),
      { status: 200 }
    );
  }
}
