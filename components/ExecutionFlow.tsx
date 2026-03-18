'use client';

import { SEPOLIA_EXPLORER, cn } from '@/lib/utils';

export type ExecutionFlowStatus = 'idle' | 'running' | 'blocked' | 'complete';

export interface ExecutionPaymentDetails {
  amount?: number;
  recipient?: string;
  memo?: string;
}

interface ExecutionFlowProps {
  status: ExecutionFlowStatus;
  currentStep: number;
  rejectionReason?: string;
  txHash?: string;
  paymentDetails?: ExecutionPaymentDetails;
  onEditPayment?: () => void;
  onOpenSettings?: () => void;
}

const STEPS = [
  'Parsing intent...',
  'Extracting recipient...',
  'Checking policy rules...',
  'Generating justification...',
  'Awaiting confirmation...',
  'Executing on-chain...',
  'Receipt generated'
] as const;

function truncateRecipient(value?: string): string {
  if (!value) return 'Unknown recipient';
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function ExecutionFlow({
  status,
  currentStep,
  rejectionReason,
  txHash,
  paymentDetails,
  onEditPayment,
  onOpenSettings
}: ExecutionFlowProps) {
  if (status === 'idle') return null;

  return (
    <div className="rounded-[20px] border border-white/10 border-l-2 border-l-[rgba(0,200,150,0.2)] bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.82))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <p className={cn('font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500', status === 'blocked' && 'text-red-300')}>
        {status === 'blocked' ? 'Transaction Rejected' : status === 'complete' ? 'Payment Complete' : 'Execution Flow'}
      </p>

      <div className="mt-5 space-y-4">
        {STEPS.map((step, index) => {
          const isBlockedStep = status === 'blocked' && index === currentStep;
          const isCompleteStep = status === 'complete' ? index <= currentStep : index < currentStep;
          const isActiveStep = status === 'running' && index === currentStep;
          const isWaitingStep = !isBlockedStep && !isCompleteStep && !isActiveStep;
          const icon = isBlockedStep ? '✗' : isCompleteStep ? '✓' : isActiveStep ? '⟳' : '⟳';

          return (
            <div key={step} className="relative pl-8">
              {index < STEPS.length - 1 ? (
                <span
                  className={cn(
                    'absolute left-[11px] top-5 h-[calc(100%+12px)] w-px bg-white/10',
                    isCompleteStep && 'bg-[#00c896]/50',
                    isBlockedStep && 'bg-red-500/50'
                  )}
                />
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div className="relative">
                  <span
                    className={cn(
                      'absolute left-[-21px] top-[5px] h-3 w-3 rounded-full border',
                      isCompleteStep && 'border-[#00c896] bg-[#00c896]',
                      isActiveStep && 'border-amber-400 bg-amber-400 animate-pulse',
                      isBlockedStep && 'border-red-500 bg-red-500',
                      isWaitingStep && 'border-slate-600 bg-slate-700/80'
                    )}
                  />
                  <p
                    className={cn(
                      'font-mono text-sm text-slate-300',
                      isCompleteStep && 'text-[#7ef0c6]',
                      isActiveStep && 'text-amber-200',
                      isBlockedStep && 'text-red-300',
                      isWaitingStep && 'text-slate-500'
                    )}
                  >
                    {step}
                  </p>
                  {isBlockedStep && rejectionReason ? (
                    <p className="mt-2 font-mono text-xs text-red-300">BLOCKED: {rejectionReason}</p>
                  ) : null}
                </div>

                <span
                  className={cn(
                    'min-w-4 pt-px text-right font-mono text-sm',
                    isCompleteStep && 'text-[#00c896]',
                    isActiveStep && 'text-amber-300',
                    isBlockedStep && 'text-red-400',
                    isWaitingStep && 'text-slate-600'
                  )}
                >
                  {icon}
                </span>
              </div>

              {status === 'complete' && index === 6 ? (
                <div className="mt-4 rounded-2xl border border-[#00c896]/25 bg-[rgba(0,200,150,0.08)] p-4">
                  <p className="font-mono text-sm text-[#7ef0c6]">Payment Complete</p>
                  <div className="mt-3 grid gap-1 font-mono text-xs text-emerald-50/90">
                    <p>Amount: {paymentDetails?.amount ? `${paymentDetails.amount} USDT` : 'N/A'}</p>
                    <p>Recipient: {truncateRecipient(paymentDetails?.recipient)}</p>
                    <p>Memo: {paymentDetails?.memo?.trim() ? paymentDetails.memo : 'N/A'}</p>
                  </div>
                  {txHash ? (
                    <a
                      href={`${SEPOLIA_EXPLORER}${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block break-all font-mono text-xs text-[#7ef0c6] underline decoration-[#00c896]/40 underline-offset-4 hover:text-white"
                    >
                      Tx Hash: {txHash}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {status === 'blocked' ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={onEditPayment}
            className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-xs text-red-200 transition hover:bg-red-500/20"
          >
            Edit Payment
          </button>
          <button
            onClick={onOpenSettings}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-xs text-slate-200 transition hover:border-red-400/30 hover:bg-white/[0.06]"
          >
            Open Settings
          </button>
        </div>
      ) : null}
    </div>
  );
}
