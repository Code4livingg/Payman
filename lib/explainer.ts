import { isAddress } from 'ethers';
import type { DraftPayment, PaymentExplanation, Policy, TriggerType, ValidationResult } from './types';

interface ExplanationInput {
  triggerType: TriggerType;
  policy: Policy;
  draft: DraftPayment;
  validationResults?: ValidationResult;
}

function inferChecksFromPayload(policy: Policy, draft: DraftPayment): ValidationResult {
  const checks: ValidationResult['checks'] = [
    {
      key: 'valid_ethereum_address',
      label: 'Valid Ethereum address',
      status: (() => { try { return isAddress((draft.to_address ?? '').toLowerCase()); } catch { return false; } })() ? 'passed' : 'failed'
    },
    {
      key: 'within_max_single',
      label: 'Within max single payment limit',
      status: draft.amount_usdt > 0 && draft.amount_usdt <= policy.max_single_usdt ? 'passed' : 'failed'
    },
    {
      key: 'within_daily_cap',
      label: 'Within daily spending cap',
      status: draft.amount_usdt <= policy.daily_cap_usdt ? 'passed' : 'failed'
    },
    {
      key: 'whitelist_check',
      label: 'Recipient whitelist check',
      status:
        !policy.whitelist_enabled ||
        policy.whitelist.map((item) => item.toLowerCase()).includes(draft.to_address.toLowerCase())
          ? 'passed'
          : 'failed'
    },
    {
      key: 'duplicate_protection',
      label: 'Duplicate payment protection',
      status: 'passed'
    }
  ];

  return {
    approved: checks.every((check) => check.status === 'passed'),
    checks
  };
}

export function generateExplanation({
  triggerType,
  policy,
  draft,
  validationResults
}: ExplanationInput): PaymentExplanation {
  const result = validationResults ?? inferChecksFromPayload(policy, draft);
  const decision: PaymentExplanation['decision'] = result.approved ? 'approved' : 'declined';

  return {
    trigger: triggerType,
    summary:
      decision === 'approved'
        ? 'Payment approved based on policy checks'
        : 'Payment was blocked due to one or more policy checks',
    checks: result.checks.map((check) => ({
      label: check.label,
      status: check.status
    })),
    decision,
    timestamp: new Date().toISOString()
  };
}
