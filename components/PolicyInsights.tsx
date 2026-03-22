import type { PaymentExplanation } from '@/lib/types';

interface PolicyInsightsProps {
  explanation: PaymentExplanation;
}

function getRiskLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 85) return { label: 'Low', color: '#00c896' };
  if (confidence >= 60) return { label: 'Medium', color: '#f59e0b' };
  return { label: 'High', color: '#ef4444' };
}

function getBarColor(confidence: number): string {
  if (confidence >= 85) return 'linear-gradient(90deg, #00c896, #00a878)';
  if (confidence >= 60) return 'linear-gradient(90deg, #f59e0b, #d97706)';
  return 'linear-gradient(90deg, #ef4444, #dc2626)';
}

export function PolicyInsights({ explanation }: PolicyInsightsProps) {
  if (!explanation || !Array.isArray(explanation.checks) || explanation.checks.length === 0) {
    return null;
  }

  const totalChecks = explanation.checks.length;
  const passedChecks = explanation.checks.filter((c) => c.status === 'passed').length;
  const confidence = Math.round((passedChecks / totalChecks) * 100);
  const isApproved = explanation.decision === 'approved';
  const risk = getRiskLabel(confidence);

  const reasoningText = isApproved
    ? 'All policy checks passed. Transaction is within safe execution bounds.'
    : 'One or more policy checks failed. Execution prevented to ensure safety.';

  return (
    <div
      style={{
        marginBottom: 12,
        padding: '12px 14px',
        borderRadius: 14,
        border: isApproved
          ? '1px solid rgba(0,200,150,0.2)'
          : '1px solid rgba(239,68,68,0.2)',
        background: isApproved
          ? 'rgba(0,200,150,0.04)'
          : 'rgba(239,68,68,0.04)',
        animation: 'policyInsightsFadeIn 300ms ease-out both',
        willChange: 'transform, opacity'
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        {/* Decision badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            background: isApproved ? 'rgba(0,200,150,0.15)' : 'rgba(239,68,68,0.15)',
            color: isApproved ? '#00c896' : '#ef4444',
            border: isApproved ? '1px solid rgba(0,200,150,0.3)' : '1px solid rgba(239,68,68,0.3)'
          }}
        >
          {isApproved ? '✓' : '✗'} {isApproved ? 'Approved' : 'Blocked'}
        </span>

        {/* Confidence + Risk */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
            Confidence: <span style={{ color: '#fff', fontWeight: 600 }}>{confidence}%</span>
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
            Risk: <span style={{ color: risk.color, fontWeight: 600 }}>{risk.label}</span>
          </span>
        </div>
      </div>

      {/* Risk bar */}
      <div
        style={{
          marginTop: 10,
          height: 3,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${confidence}%`,
            borderRadius: 999,
            background: getBarColor(confidence),
            transition: 'width 600ms ease-out'
          }}
        />
      </div>

      {/* Reasoning */}
      <p
        style={{
          marginTop: 8,
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'monospace',
          lineHeight: 1.5
        }}
      >
        {reasoningText}
      </p>
    </div>
  );
}
