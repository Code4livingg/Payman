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

function formatRecipient(value?: string) {
  if (!value) return 'Unknown';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
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
  const blockedStep = status === 'blocked' && currentStep <= 2 ? 2 : currentStep;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: '3px solid rgba(0,200,150,0.3)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 16
      }}
    >
      {STEPS.map((step, index) => {
        const isComplete = status === 'complete' || (status !== 'blocked' && index < currentStep);
        const isBlocked = status === 'blocked' && index === blockedStep;
        const isActive = !isBlocked && status !== 'complete' && index === currentStep && (status === 'running' || status === 'awaiting');
        const isPending = !isComplete && !isBlocked && !isActive;

        const dotColor = isBlocked ? '#ef4444' : isActive ? '#f59e0b' : isComplete ? '#00c896' : '#2a2a3a';
        const labelColor = isBlocked ? '#ef4444' : isActive ? '#f59e0b' : isComplete ? '#00c896' : 'rgba(255,255,255,0.45)';
        const icon = isBlocked ? '✗' : isActive ? '⟳' : isComplete ? '✓' : '';

        return (
          <div key={step}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8
              }}
            >
              <div style={{ position: 'relative', width: 14, height: 24, flexShrink: 0 }}>
                {index < STEPS.length - 1 ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: 4,
                      top: 10,
                      width: 2,
                      height: 26,
                      background: 'rgba(255,255,255,0.08)'
                    }}
                  />
                ) : null}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 5,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: dotColor,
                    animation: isActive ? 'pulseAmber 1.2s ease-in-out infinite' : undefined
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: labelColor
                }}
              >
                {step}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 14,
                  color: isBlocked ? '#ef4444' : isComplete ? '#00c896' : isActive ? '#f59e0b' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 14
                }}
              >
                {icon === '⟳' ? <span style={{ display: 'inline-block', animation: 'spinIcon 1s linear infinite' }}>{icon}</span> : icon}
              </span>
            </div>

            {status === 'awaiting' && currentStep === 4 && index === 4 ? (
              <div style={{ margin: '6px 0 12px 24px' }}>
                <button
                  onClick={onConfirm}
                  style={{
                    width: '100%',
                    padding: 10,
                    background: '#00c896',
                    color: '#000',
                    borderRadius: 50,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Confirm & Execute Payment
                </button>
              </div>
            ) : null}

            {status === 'blocked' && index === blockedStep ? (
              <div
                style={{
                  margin: '6px 0 12px 24px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 12,
                  padding: 12
                }}
              >
                <div style={{ color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', fontSize: 12 }}>Blocked</div>
                <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  {rejectionReason || 'Payment rejected by policy or execution checks.'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={onRetry}
                    style={{
                      borderRadius: 999,
                      padding: '8px 12px',
                      border: '1px solid rgba(239,68,68,0.2)',
                      background: 'rgba(239,68,68,0.08)',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Edit Payment
                  </button>
                  <button
                    onClick={onOpenSettings}
                    style={{
                      borderRadius: 999,
                      padding: '8px 12px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Open Settings
                  </button>
                </div>
              </div>
            ) : null}

            {status === 'complete' && index === 6 ? (
              <div
                style={{
                  margin: '6px 0 0 24px',
                  background: 'rgba(0,200,150,0.06)',
                  border: '1px solid rgba(0,200,150,0.2)',
                  borderRadius: 12,
                  padding: 16
                }}
              >
                <div style={{ color: '#00c896', fontWeight: 700, fontSize: 14 }}>Payment Complete ✓</div>
                <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Amount: {amount ?? 0} USDC</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>To: {formatRecipient(recipient)}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Memo: {memo || '-'}</div>
                  {txHash ? (
                    <a
                      href={`${SEPOLIA_EXPLORER}${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#00c896',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}
                    >
                      Tx hash: {txHash}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
