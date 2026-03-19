'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PaymanLogo } from '@/components/PaymanLogo';
import { TypewriterHeadline } from '@/components/TypewriterHeadline';

const FEATURE_PILLS = ['Intent Parser', 'Policy Engine', 'Justification Layer', 'Receipt System', 'Audit Trail', 'WDK Wallet'];
const EXECUTION_STEPS = [
  'Intent parsed',
  'Recipient verified',
  'Policy check passed',
  'Justification generated',
  'Awaiting confirmation...'
];

export default function LandingPage() {
  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [validationCount, setValidationCount] = useState(0);
  const [policyCount, setPolicyCount] = useState(0);
  const [auditCount, setAuditCount] = useState(0);

  const executionStatus = useMemo(() => (visibleStepCount >= EXECUTION_STEPS.length ? 'Authorized' : 'Pending'), [visibleStepCount]);

  useEffect(() => {
    const stepTimers = EXECUTION_STEPS.map((_, idx) =>
      setTimeout(() => {
        setVisibleStepCount(idx + 1);
      }, idx * 600 + 300)
    );

    const statsTimer = setInterval(() => {
      setValidationCount((prev) => (prev < 7 ? prev + 1 : prev));
      setPolicyCount((prev) => (prev < 100 ? prev + 10 : prev));
      setAuditCount((prev) => (prev < 24 ? prev + 2 : prev));
    }, 70);

    const stopStats = setTimeout(() => clearInterval(statsTimer), 900);

    return () => {
      stepTimers.forEach((timer) => clearTimeout(timer));
      clearInterval(statsTimer);
      clearTimeout(stopStats);
      };
  }, []);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#0a0a0f] px-5 py-6 text-slate-100 transition-all duration-300 ease-in-out md:px-10"
      style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'rgba(124,58,237,0.07)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(0,200,150,0.06)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <nav className="glass-card sticky top-3 z-20 mb-6 flex items-center justify-between rounded-2xl border-b px-5 py-3">
          <PaymanLogo size="md" />
          <div className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
            <span className="hover:text-white">Execution</span>
            <span className="hover:text-white">Policies</span>
            <span className="hover:text-white">Audit</span>
            <Link href="/app">
              <button className="rounded-full bg-[#00c896] px-4 py-1.5 text-xs font-semibold text-black">Launch App</button>
            </Link>
          </div>
        </nav>

        <section className="relative z-[1] grid min-h-[88vh] items-center gap-8 md:grid-cols-2">
          <div className="relative z-[1] animate-[fadeInUp_500ms_ease-out] space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00c896]/40 bg-[#00c896]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#00c896]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00c896] animate-[pulse_2s_ease-in-out_infinite]" />
              Live
            </div>

            <div>
              <TypewriterHeadline />
              <p className="mt-5 max-w-[480px] text-[18px] text-[#6b7280]">
                Every transaction is validated, enforced, and explained — before it executes.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div
                className="glass-card rounded-2xl px-5 py-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,200,150,0.06), rgba(0,200,150,0.02))',
                  borderLeft: '3px solid #00c896'
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: '#00c896' }}>VALIDATION</p>
                <p className="mt-1 text-base font-semibold text-white">{validationCount}-step validation</p>
              </div>
              <div
                className="glass-card rounded-2xl px-5 py-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(124,58,237,0.02))',
                  borderLeft: '3px solid #7c3aed'
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: '#a78bfa' }}>POLICY</p>
                <p className="mt-1 text-base font-semibold text-white">{policyCount}% policy-enforced</p>
              </div>
              <div
                className="glass-card rounded-2xl px-5 py-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))',
                  borderLeft: '3px solid #f59e0b'
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: '#f59e0b' }}>AUDIT</p>
                <p className="mt-1 text-base font-semibold text-white">{auditCount}/24 Full audit trail</p>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap gap-3">
                <Link href="/app">
                  <button className="rounded-full bg-[#00c896] px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:brightness-110">
                    Execute with Payman
                  </button>
                </Link>
                <Link href="/system" className="rounded-full border border-white/20 bg-transparent px-6 py-3 text-sm text-white transition hover:bg-white/5">
                  View System ↓
                </Link>
              </div>
              <p className="mt-2 text-xs text-[#6b7280]">Every action is policy-verified before execution.</p>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2">
                {FEATURE_PILLS.map((pill) => (
                  <span key={pill} className="glass-card rounded-full px-3 py-1 font-mono text-xs text-slate-300 transition hover:border-[#00c896]/60">
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-[1]" style={{ minHeight: 640 }}>
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
              viewBox="0 0 500 640"
            >
              <text x="30" y="80" fill="rgba(0,200,150,0.2)" fontSize="20" fontFamily="monospace">+</text>
              <text x="440" y="120" fill="rgba(124,58,237,0.2)" fontSize="16" fontFamily="monospace">+</text>
              <text x="60" y="500" fill="rgba(0,200,150,0.15)" fontSize="18" fontFamily="monospace">+</text>
              <text x="420" y="540" fill="rgba(245,158,11,0.2)" fontSize="14" fontFamily="monospace">+</text>
              <circle cx="45" cy="180" r="4" fill="none" stroke="rgba(0,200,150,0.2)" strokeWidth="1.5" />
              <circle cx="455" cy="380" r="6" fill="none" stroke="rgba(124,58,237,0.2)" strokeWidth="1.5" />
              <circle cx="112" cy="138" r="30" fill="rgba(124,58,237,0.2)" />
              <circle cx="392" cy="470" r="24" fill="rgba(124,58,237,0.2)" />
              <circle cx="80" cy="420" r="3" fill="rgba(0,200,150,0.15)" />
              <circle cx="430" cy="200" r="3" fill="rgba(245,158,11,0.2)" />
              <circle cx="470" cy="480" r="5" fill="none" stroke="rgba(0,200,150,0.15)" strokeWidth="1" />
              <polygon points="35,310 42,300 49,310 42,320" fill="none" stroke="rgba(0,200,150,0.18)" strokeWidth="1.2" />
              <polygon points="460,300 467,290 474,300 467,310" fill="none" stroke="rgba(124,58,237,0.2)" strokeWidth="1.2" />
              <g opacity="0.15">
                {Array.from({ length: 5 }).map((_, row) =>
                  Array.from({ length: 5 }).map((__, col) => (
                    <circle key={`${row}-${col}`} cx={360 + col * 16} cy={40 + row * 16} r="1" fill="#00c896" />
                  ))
                )}
              </g>
              <g opacity="0.10">
                {Array.from({ length: 4 }).map((_, row) =>
                  Array.from({ length: 4 }).map((__, col) => (
                    <circle key={`b${row}-${col}`} cx={20 + col * 14} cy={520 + row * 14} r="1" fill="#7c3aed" />
                  ))
                )}
              </g>
              <path d="M 20 240 Q 60 200 40 160" fill="none" stroke="rgba(0,200,150,0.12)" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M 440 440 L 460 460 L 440 480" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="10" y="260" width="56" height="22" rx="11" fill="rgba(0,200,150,0.08)" stroke="rgba(0,200,150,0.2)" strokeWidth="1" />
              <text x="38" y="275" fill="#00c896" fontSize="9" fontFamily="monospace" textAnchor="middle">USDT ✓</text>
              <rect x="434" y="340" width="52" height="22" rx="11" fill="rgba(124,58,237,0.08)" stroke="rgba(124,58,237,0.25)" strokeWidth="1" />
              <text x="460" y="355" fill="#a78bfa" fontSize="9" fontFamily="monospace" textAnchor="middle">WDK</text>
              <rect x="8" y="450" width="66" height="22" rx="11" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.25)" strokeWidth="1" />
              <text x="41" y="465" fill="#f59e0b" fontSize="9" fontFamily="monospace" textAnchor="middle">POLICY ✓</text>
            </svg>

            <div className="relative z-[1] flex min-h-[640px] items-center justify-center">
              <div
                style={{
                  position: 'relative',
                  width: 420,
                  height: 640
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    zIndex: 0,
                    width: 280,
                    height: 280,
                    background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)',
                    left: -40,
                    top: 80,
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    pointerEvents: 'none'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    zIndex: 0,
                    width: 320,
                    height: 320,
                    background: 'radial-gradient(circle, rgba(0,200,150,0.18), transparent 70%)',
                    right: -20,
                    top: 60,
                    borderRadius: '50%',
                    filter: 'blur(70px)',
                    pointerEvents: 'none'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: -10,
                    top: 80,
                    zIndex: 3,
                    background: 'rgba(0,200,150,0.08)',
                    border: '1px solid rgba(0,200,150,0.25)',
                    borderRadius: 20,
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backdropFilter: 'blur(18px)'
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c896', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: '#00c896' }}>Policy Active</span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    right: -30,
                    top: 220,
                    zIndex: 3,
                    background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.25)',
                    borderRadius: 20,
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backdropFilter: 'blur(18px)'
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: '#a78bfa' }}>WDK Secured</span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: -20,
                    bottom: 100,
                    zIndex: 3,
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 20,
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backdropFilter: 'blur(18px)'
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: '#f59e0b' }}>Audit Trail</span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 40,
                    width: 240,
                    height: 500,
                    transform: 'rotate(-6deg) translateX(-20px)',
                    zIndex: 1,
                    borderRadius: 40,
                    border: '6px solid #1a1a2e',
                    background: 'linear-gradient(160deg, #0f0f1a 0%, #0a0a12 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(124,58,237,0.15)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      padding: '32px 14px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: 'rgba(0,200,150,0.12)',
                          color: '#00c896',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 10,
                          fontWeight: 700
                        }}
                      >
                        P
                      </div>
                      <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#00c896', letterSpacing: '0.14em' }}>PAYMAN</div>
                    </div>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,200,150,0.15))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        padding: 16
                      }}
                    >
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}>USDT Balance</div>
                      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, color: '#fff' }}>1,250.00</div>
                      <div style={{ marginTop: 8, fontSize: 8, color: '#22c55e' }}>● Sepolia Testnet</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {[
                        { dot: '#22c55e', label: 'Payment sent', amount: '−50 USDT', amountColor: '#f87171' },
                        { dot: '#38bdf8', label: 'Invoice paid', amount: '+200 USDT', amountColor: '#22c55e' },
                        { dot: '#f59e0b', label: 'Schedule ran', amount: '−100 USDT', amountColor: '#f87171' }
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            fontSize: 9,
                            color: 'rgba(255,255,255,0.72)'
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                          <span>{item.label}</span>
                          <span style={{ marginLeft: 'auto', color: item.amountColor }}>{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: 270,
                    height: 580,
                    transform: 'rotate(3deg)',
                    zIndex: 2,
                    borderRadius: 44,
                    border: '7px solid #1e1e2e',
                    background: 'linear-gradient(160deg, #12121f 0%, #0a0a14 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.08), 0 50px 120px rgba(0,0,0,0.9), 0 0 100px rgba(0,200,150,0.20), 0 0 40px rgba(0,200,150,0.10), inset 0 1px 0 rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    animation: 'phoneFloatFront 4s ease-in-out infinite'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 100,
                      height: 28,
                      background: '#0a0a14',
                      borderRadius: '0 0 20px 20px',
                      zIndex: 10
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a1a2e', margin: '10px auto 0' }} />
                  </div>
                  <div style={{ position: 'absolute', right: -8, top: 100, width: 3, height: 56, background: '#1e1e2e', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', right: -8, top: 180, width: 3, height: 30, background: '#1e1e2e', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', right: -8, top: 220, width: 3, height: 30, background: '#1e1e2e', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', left: -8, top: 150, width: 3, height: 44, background: '#1e1e2e', borderRadius: 2 }} />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      padding: '40px 16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <PaymanLogo size="sm" />
                      <span
                        style={{
                          fontSize: 9,
                          background: 'rgba(0,200,150,0.15)',
                          border: '1px solid rgba(0,200,150,0.3)',
                          color: '#00c896',
                          padding: '3px 8px',
                          borderRadius: 20
                        }}
                      >
                        ● LIVE
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        fontFamily: 'monospace',
                        color: 'rgba(0,200,150,0.5)',
                        letterSpacing: '0.15em',
                        textAlign: 'center'
                      }}
                    >
                      EXECUTION ENGINE
                    </div>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,200,150,0.08), rgba(124,58,237,0.06))',
                        border: '1px solid rgba(0,200,150,0.2)',
                        borderRadius: 12,
                        padding: '10px 12px',
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.9)',
                        fontStyle: 'italic',
                        lineHeight: 1.5
                      }}
                    >
                      "Send 20 USDT to vendor for API sprint"
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {EXECUTION_STEPS.map((step, idx) => {
                        const visible = visibleStepCount > idx;
                        const waiting = idx === EXECUTION_STEPS.length - 1;
                        return (
                          <div
                            key={step}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              opacity: visible ? 1 : 0.35
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: waiting ? '#f59e0b' : '#00c896',
                                animation: waiting ? 'pulseAmber 1.2s ease infinite' : undefined,
                                display: 'inline-block',
                                flexShrink: 0
                              }}
                            />
                            <span
                              style={{
                                color: waiting ? '#f59e0b' : '#00c896',
                                fontSize: 10,
                                fontFamily: 'monospace'
                              }}
                            >
                              {waiting ? `○ ${step}` : `✓ ${step}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto' }}>
                      {['Budget ✓', 'Whitelist ✓', 'Risk: Low ✓'].map((item) => (
                        <span
                          key={item}
                          style={{
                            fontSize: 8,
                            padding: '2px 6px',
                            borderRadius: 20,
                            background: 'rgba(0,200,150,0.1)',
                            border: '1px solid rgba(0,200,150,0.25)',
                            color: '#00c896'
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <button
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'linear-gradient(135deg, #00c896, #00b584)',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: 12,
                        borderRadius: 50,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 24px rgba(0,200,150,0.4), 0 2px 8px rgba(0,200,150,0.2)'
                      }}
                    >
                      {executionStatus} ✓
                    </button>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      {['ERC-20', 'Sepolia', 'WDK'].map((item) => (
                        <span
                          key={item}
                          style={{
                            fontSize: 7,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.4)',
                            padding: '2px 6px',
                            borderRadius: 20
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 70,
                      height: 3,
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 2
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 border-y border-white/10 bg-white/[0.01] py-20">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#00c896]">System Architecture</p>
              <h2 className="mt-3 max-w-[700px] text-4xl font-bold leading-tight text-white md:text-[52px]">
                Every decision is verified before money moves.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-400">A policy-controlled AI execution engine for safe autonomous financial operations.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="glass-card inline-flex items-center gap-3 rounded-full px-5 py-3">
                <span className="relative h-5 w-5 rounded-full border border-[#00c896]/60">
                  <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-[#00c896]" />
                </span>
                <span className="text-sm text-slate-200">AI command interpretation</span>
              </div>
              <div className="glass-card inline-flex items-center gap-3 rounded-full px-5 py-3">
                <span className="h-5 w-5 rounded-md border border-[#00c896]/60" />
                <span className="text-sm text-slate-200">Deterministic policy validation</span>
              </div>
              <div className="glass-card inline-flex items-center gap-3 rounded-full px-5 py-3">
                <span className="h-5 w-4 rounded-sm border border-[#00c896]/60" />
                <span className="text-sm text-slate-200">Explainable transaction output</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] p-10">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 260" fill="none" preserveAspectRatio="none">
                <path d="M190 130H320" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[flowDash_1.5s_linear_infinite]" />
                <path d="M380 130H510" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[flowDash_1.5s_linear_infinite]" />
                <path d="M570 130H700" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[flowDash_1.5s_linear_infinite]" />
                <path d="M760 130H890" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[flowDash_1.5s_linear_infinite]" />
                <path d="M950 130H1080" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[flowDash_1.5s_linear_infinite]" />
              </svg>
              <div className="relative z-10 grid grid-cols-2 gap-4 md:grid-cols-6">
                {[
                  { label: 'Intent', dot: 'bg-[#7c3aed]', hover: 'hover:border-[#7c3aed]/40' },
                  { label: 'Parser', dot: 'bg-[#00c896]', hover: 'hover:border-[#00c896]/40' },
                  { label: 'Policy', dot: 'bg-[#00c896]', hover: 'border-[#00c896] bg-[#00c896]/10' },
                  { label: 'Justify', dot: 'bg-[#f59e0b]', hover: 'hover:border-[#f59e0b]/40' },
                  { label: 'Execute', dot: 'bg-[#00c896]', hover: 'hover:border-[#00c896]/40' },
                  { label: 'Receipt', dot: 'bg-green-500', hover: 'hover:border-green-500/40' }
                ].map((node) => (
                  <div key={node.label} className="relative mx-auto">
                    {node.label === 'Policy' ? (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full border border-[#00c896]/40 bg-[#00c896]/15 px-2 py-0.5 text-[10px] text-[#00c896]">
                        CORE
                      </span>
                    ) : null}
                    <div className={`glass-card flex h-[80px] w-[100px] flex-col items-center justify-center gap-2 rounded-2xl ${node.hover}`}>
                      <span className={`h-4 w-4 rounded-full ${node.dot}`} />
                      <span className="font-mono text-[11px] text-slate-200">{node.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="glass-card rounded-[20px] border-l-2 border-l-[#00c896]/60 p-5">
                <div className="mb-3 h-6 w-6 space-y-1">
                  <span className="block h-1 rounded bg-[#00c896]/70" />
                  <span className="block h-1 rounded bg-[#00c896]/50" />
                  <span className="block h-1 rounded bg-[#00c896]/35" />
                </div>
                <h3 className="text-lg font-semibold text-white">Architecture</h3>
                <p className="mt-2 text-sm text-slate-400">System topology and execution boundaries across policy rails.</p>
                <p className="mt-4 text-sm text-[#00c896]">Explore →</p>
              </article>
              <article className="glass-card rounded-[20px] border-l-2 border-l-[#7c3aed]/60 p-5">
                <div className="mb-3 h-6 w-6 rounded-md bg-[#7c3aed]/30" />
                <h3 className="text-lg font-semibold text-white">How It Works</h3>
                <p className="mt-2 text-sm text-slate-400">Step-by-step logic from intent parsing through verified execution.</p>
                <p className="mt-4 text-sm text-[#7c3aed]">Explore →</p>
              </article>
              <article className="glass-card rounded-[20px] border-l-2 border-l-[#f59e0b]/60 p-5">
                <div className="mb-3 h-6 w-6 rounded-md bg-[#f59e0b]/30" />
                <h3 className="text-lg font-semibold text-white">About</h3>
                <p className="mt-2 text-sm text-slate-400">Product mission and trust model for autonomous financial control.</p>
                <p className="mt-4 text-sm text-[#f59e0b]">Explore →</p>
              </article>
            </div>
          </div>
        </section>

        <footer className="mt-5 pb-3 text-center text-xs text-slate-500">
          Built on Tether WDK • Apache 2.0 • Hackathon Galactica 2026
        </footer>
      </div>
    </main>
  );
}
