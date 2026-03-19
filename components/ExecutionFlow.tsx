'use client';

import { SEPOLIA_EXPLORER } from '@/lib/utils';

export type ExecutionFlowStatus = 'idle' | 'running' | 'blocked' | 'awaiting' | 'complete';

interface ExecutionFlowProps {
  status: ExecutionFlowStatus;
  currentStep: number;
  rejectionReason?: string;
  txHash?: string;
  amount?: number;
  recipient?: string;
  memo?: string;
  onConfirm?: () => void;
  onRetry?: () => void;
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
  amount,
  recipient,
  memo,
  onConfirm,
  onRetry,
  onOpenSettings
}: ExecutionFlowProps) {
  if (status === 'idle') return null;

  return (
    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] border-l-[3px] border-l-[rgba(0,200,150,0.3)] bg-[rgba(255,255,255,0.03)] p-6 backdrop-blur-xl">
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const isBlocked = status === 'blocked' && index === currentStep;
          const isDone = status === 'complete' ? index <= currentStep : index < currentStep;
          const isActive = (status === 'running' || status === 'awaiting') && index === currentStep;
          const dotClass = isBlocked
            ? 'bg-red-500'
            : isDone
              ? 'bg-[#00c896]'
              : isActive
                ? 'bg-amber-400 animate-[pulseAmber_1.2s_ease_infinite]'
                : 'bg-slate-600';
          const icon = isBlocked ? '✗' : isDone ? '✓' : isActive ? '⟳' : '';

          return (
            <div key={step}>
              <div className="flex items-center gap-2.5">
                <span className={`h-[10px] w-[10px] rounded-full ${dotClass}`} />
                <span
                  className={`font-mono text-[12px] ${
                    isBlocked ? 'text-red-300' : isDone ? 'text-[#7ef0c6]' : isActive ? 'text-amber-200' : 'text-slate-400'
                  }`}
                >
                  {step}
                </span>
                <span className="ml-auto font-mono text-sm text-slate-300">
                  {icon === '⟳' ? <span className="inline-block animate-[spinIcon_1s_linear_infinite]">{icon}</span> : icon}
                </span>
              </div>

              {status === 'awaiting' && index === 4 ? (
                <div className="mt-3 pl-5">
                  <button
                    onClick={onConfirm}
                    className="rounded-full bg-[#00c896] px-4 py-2 text-sm font-medium text-black transition hover:brightness-110"
                  >
                    Confirm Payment
                  </button>
                </div>
              ) : null}

              {isBlocked && rejectionReason ? (
                <div className="mt-2 pl-5">
                  <p className="font-mono text-[12px] text-red-300">{rejectionReason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={onRetry}
                      className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-xs text-red-200 transition hover:bg-red-500/20"
                    >
                      Edit Payment
                    </button>
                    <button
                      onClick={onOpenSettings}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-xs text-slate-200 transition hover:bg-white/[0.08]"
                    >
                      Open Settings
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {status === 'complete' && currentStep >= 6 ? (
        <div className="mt-5 rounded-xl border border-[rgba(0,200,150,0.2)] bg-[rgba(0,200,150,0.06)] p-4">
          <p className="font-semibold text-[#00c896]">Payment Complete ✓</p>
          <div className="mt-3 grid gap-1 font-mono text-xs text-slate-200">
            <p>Amount: {amount ? `${amount} USDT` : 'N/A'}</p>
            <p>Recipient: {truncateRecipient(recipient)}</p>
            <p>Memo: {memo?.trim() ? memo : 'N/A'}</p>
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
}
