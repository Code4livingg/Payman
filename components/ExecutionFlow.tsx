'use client';

import { useEffect, useState } from 'react';
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

// Each step reveals with a staggered delay
const STEP_REVEAL_DELAY = 120; // ms per step

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
  // Track which steps are visible (for sequential reveal)
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>(Array(STEPS.length).fill(false));
  // Delay showing the blocked card slightly so it feels controlled
  const [showBlocked, setShowBlocked] = useState(false);

  const blockedStep = status === 'blocked' && currentStep <= 2 ? 2 : currentStep;

  // Reveal steps sequentially up to currentStep
  useEffect(() => {
    const maxVisible = status === 'complete' ? STEPS.length : currentStep + 1;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < maxVisible; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleSteps((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * STEP_REVEAL_DELAY)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [currentStep, status]);

  // Delay blocked card appearance
  useEffect(() => {
    if (status !== 'blocked') {
      setShowBlocked(false);
      return;
    }
    const t = setTimeout(() => setShowBlocked(true), 500);
    return () => clearTimeout(t);
  }, [status]);

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
        const isVisible = visibleSteps[index];
        const isComplete = status === 'complete' || (status !== 'blocked' && index < currentStep);
        const isBlocked = status === 'blocked' && index === blockedStep;
        const isActive =
          !isBlocked &&
          status !== 'complete' &&
          index === currentStep &&
          (status === 'running' || status === 'awaiting');

        const dotColor = isBlocked
          ? '#ef4444'
          : isActive
          ? '#f59e0b'
          : isComplete
          ? '#00c896'
          : 'rgba(255,255,255,0.12)';

        const labelColor = isBlocked
          ? '#ef4444'
          : isActive
          ? '#fff'
          : isComplete
          ? 'rgba(0,200,150,0.7)'
          : 'rgba(255,255,255,0.3)';

        return (
          <div
            key={step}
            style={{
              opacity: isVisible ? (isComplete && !isActive ? 0.55 : 1) : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 250ms ease-out, transform 250ms ease-out',
              willChange: 'transform, opacity'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {/* Timeline connector + dot */}
              <div style={{ position: 'relative', width: 14, height: 24, flexShrink: 0 }}>
                {index < STEPS.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 4,
                      top: 10,
                      width: 2,
                      height: 26,
                      background: 'rgba(255,255,255,0.06)'
                    }}
                  />
                )}
                {/* Active: pulsing dot */}
                {isActive ? (
                  <div style={{ position: 'absolute', left: 0, top: 5 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: dotColor,
                        animation: 'pulseAmber 1.2s ease-in-out infinite'
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 5,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: dotColor,
                      transition: 'background 300ms ease'
                    }}
                  />
                )}
              </div>

              {/* Step label — shimmer when active */}
              <span
                style={
                  isActive
                    ? {
                        fontFamily: 'monospace',
                        fontSize: 12,
                        background: 'linear-gradient(90deg, #aaa 0%, #fff 50%, #aaa 100%)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'shimmerText 1.5s linear infinite'
                      }
                    : {
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: labelColor,
                        transition: 'color 300ms ease'
                      }
                }
              >
                {step}
              </span>

              {/* Status icon */}
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 13,
                  minWidth: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isBlocked ? '#ef4444' : isComplete ? '#00c896' : 'transparent'
                }}
              >
                {isBlocked ? '✗' : isComplete ? '✓' : isActive ? (
                  <span style={{ display: 'inline-block', animation: 'spinIcon 1s linear infinite', color: '#f59e0b' }}>⟳</span>
                ) : null}
              </span>
            </div>

            {/* Awaiting confirmation */}
            {status === 'awaiting' && currentStep === 4 && index === 4 && (
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
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = '';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                  }}
                  onMouseDown={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
                  }}
                >
                  Confirm & Execute Payment
                </button>
              </div>
            )}

            {/* Blocked card — delayed entry */}
            {status === 'blocked' && index === blockedStep && (
              <div
                style={{
                  margin: '6px 0 12px 24px',
                  background: 'rgba(255,80,80,0.08)',
                  border: '1px solid rgba(255,80,80,0.25)',
                  borderRadius: 12,
                  padding: 14,
                  opacity: showBlocked ? 1 : 0,
                  transform: showBlocked ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 300ms ease-out, transform 300ms ease-out'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {/* Shield icon */}
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                    <path
                      d="M6.5 1L2 3v3.5c0 2.5 1.9 4.8 4.5 5.5C9.1 11.3 11 9 11 6.5V3L6.5 1Z"
                      stroke="#ef4444"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                    <path d="M6.5 4.5v2.5M6.5 8.5h.01" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em' }}>
                    Policy Blocked Execution
                  </div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 }}>
                  Policy violation detected
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.4)',
                    wordBreak: 'break-word',
                    lineHeight: 1.5
                  }}
                >
                  {rejectionReason || 'Payment rejected by policy engine.'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={onRetry}
                    style={{
                      borderRadius: 999,
                      padding: '8px 14px',
                      border: '1px solid rgba(255,80,80,0.25)',
                      background: 'rgba(255,80,80,0.08)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = '';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                    }}
                    onMouseDown={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
                    }}
                  >
                    Edit Payment
                  </button>
                  <button
                    onClick={onOpenSettings}
                    style={{
                      borderRadius: 999,
                      padding: '8px 14px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = '';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                    }}
                    onMouseDown={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
                    }}
                  >
                    Open Settings
                  </button>
                </div>
              </div>
            )}

            {/* Complete card */}
            {status === 'complete' && index === 6 && (
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
                  {txHash && (
                    <a
                      href={`${SEPOLIA_EXPLORER}${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#00c896', fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}
                    >
                      Tx hash: {txHash}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
