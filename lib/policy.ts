import { isAddress } from 'ethers';
import type { ActivityItem, DraftPayment, Policy, ValidationCheck, ValidationResult } from './types';

export interface PolicyCheckResult {
  ok: boolean;
  reason?: string;
}

function spentToday(activity: ActivityItem[]): number {
  const today = new Date().toDateString();
  return activity
    .filter((item) => item.type === 'payment_sent' && new Date(item.timestamp).toDateString() === today)
    .reduce((sum, item) => sum + Number(item.metadata?.amount_usdt ?? 0), 0);
}

function isDuplicateWithinWindow(activity: ActivityItem[], toAddress: string, amount: number, mins: number): boolean {
  const minTime = Date.now() - mins * 60_000;
  return activity.some((item) => {
    if (item.type !== 'payment_sent') return false;
    const ts = new Date(item.timestamp).getTime();
    if (ts < minTime) return false;
    return (
      String(item.metadata?.to_address).toLowerCase() === toAddress.toLowerCase() &&
      Number(item.metadata?.amount_usdt) === amount
    );
  });
}

export function validateDraftAgainstPolicy(
  draft: DraftPayment,
  policy: Policy,
  activity: ActivityItem[]
): PolicyCheckResult {
  const validation = evaluatePaymentValidation(draft, policy, activity);
  const failed = validation.checks.find((check) => check.status === 'failed');
  if (failed) {
    return { ok: false, reason: failed.detail || `${failed.label} failed.` };
  }

  return { ok: true };
}

export function evaluatePaymentValidation(
  draft: DraftPayment,
  policy: Policy,
  activity: ActivityItem[]
): ValidationResult {
  const checks: ValidationCheck[] = [];

  const addressValid = isAddress(draft.to_address);
  checks.push({
    key: 'valid_ethereum_address',
    label: 'Valid Ethereum address',
    status: addressValid ? 'passed' : 'failed',
    detail: addressValid ? undefined : 'Recipient is not a valid Ethereum address.'
  });

  const amountPositive = draft.amount_usdt > 0;
  checks.push({
    key: 'amount_positive',
    label: 'Positive USDT amount',
    status: amountPositive ? 'passed' : 'failed',
    detail: amountPositive ? undefined : 'Amount must be greater than zero.'
  });

  const withinSingleCap = draft.amount_usdt <= policy.max_single_usdt;
  checks.push({
    key: 'within_max_single',
    label: 'Within max single payment limit',
    status: withinSingleCap ? 'passed' : 'failed',
    detail: withinSingleCap
      ? undefined
      : `Amount exceeds max single payment (${policy.max_single_usdt} USDT).`
  });

  const spent = spentToday(activity);
  const withinDailyCap = spent + draft.amount_usdt <= policy.daily_cap_usdt;
  checks.push({
    key: 'within_daily_cap',
    label: 'Within daily spending cap',
    status: withinDailyCap ? 'passed' : 'failed',
    detail: withinDailyCap ? undefined : `Daily cap exceeded. Today spent ${spent} USDT.`
  });

  let whitelistPassed = true;
  if (policy.whitelist_enabled) {
    const allowed = policy.whitelist.map((x) => x.toLowerCase());
    whitelistPassed = allowed.includes(draft.to_address.toLowerCase());
  }
  checks.push({
    key: 'whitelist_check',
    label: 'Recipient whitelist check',
    status: whitelistPassed ? 'passed' : 'failed',
    detail: whitelistPassed ? undefined : 'Recipient not found in whitelist.'
  });

  let duplicatePassed = true;
  if (policy.block_duplicate_mins > 0) {
    duplicatePassed = !isDuplicateWithinWindow(
      activity,
      draft.to_address,
      draft.amount_usdt,
      policy.block_duplicate_mins
    );
  }
  checks.push({
    key: 'duplicate_protection',
    label: 'Duplicate payment protection',
    status: duplicatePassed ? 'passed' : 'failed',
    detail: duplicatePassed
      ? undefined
      : `Duplicate payment blocked within ${policy.block_duplicate_mins} minute window.`
  });

  const memoPassed = !policy.require_memo || Boolean(draft.memo?.trim());
  checks.push({
    key: 'memo_requirement',
    label: 'Memo requirement check',
    status: memoPassed ? 'passed' : 'failed',
    detail: memoPassed ? undefined : 'Memo is required by current policy.'
  });

  return {
    approved: checks.every((check) => check.status === 'passed'),
    checks
  };
}
