'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectMetaMask, hasMetaMaskProvider, isMetaMaskUserRejected } from '@/lib/metamask';
import { storage } from '@/lib/storage';
import { PaymanLogo } from '@/components/PaymanLogo';

const FEATURE_PILLS = ['Intent Parser', 'Policy Engine', 'Justification Layer', 'Receipt System', 'Audit Trail', 'WDK Wallet'];
const EXECUTION_STEPS = [
  'Intent parsed',
  'Recipient verified',
  'Policy check passed',
  'Justification generated',
  'Awaiting confirmation...'
];

export default function LandingPage() {
  const router = useRouter();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [ctaPressed, setCtaPressed] = useState(false);
  const [focusDim, setFocusDim] = useState(false);

  const [visibleStepCount, setVisibleStepCount] = useState(0);
  const [validationCount, setValidationCount] = useState(0);
  const [policyCount, setPolicyCount] = useState(0);
  const [auditCount, setAuditCount] = useState(0);

  const executionStatus = useMemo(() => (visibleStepCount >= EXECUTION_STEPS.length ? 'Authorized' : 'Pending'), [visibleStepCount]);

  useEffect(() => {
    setHasMetaMask(hasMetaMaskProvider());

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

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = showAuthModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAuthModal]);

  const onExecuteClick = () => {
    setCtaPressed(true);
    setFocusDim(true);
    setAuthError('');
    setEmailError('');
    setTimeout(() => setCtaPressed(false), 180);
    setTimeout(() => {
      setShowEmailForm(false);
      setShowAuthModal(true);
      setFocusDim(false);
    }, 200);
  };

  const continueToApp = () => {
    setShowAuthModal(false);
    setIsTransitioning(true);
    setTimeout(() => router.push('/app'), 320);
  };

  const onViewSystem = () => router.push('/system');

  const handleConnectWallet = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    setAuthError('');

    try {
      if (!hasMetaMaskProvider()) {
        setAuthError('MetaMask not detected. Install MetaMask or continue with email demo mode.');
        setAuthLoading(false);
        return;
      }

      const connected = await connectMetaMask();
      storage.setWalletMode('metamask');
      storage.setWalletAddress(connected.address);
      continueToApp();
    } catch (error) {
      if (isMetaMaskUserRejected(error)) {
        setAuthError('Connection request was rejected. Please approve MetaMask access to continue.');
      } else {
        setAuthError('MetaMask connection failed. You can continue with email demo mode.');
      }
      setAuthLoading(false);
      return;
    }

    setAuthLoading(false);
  };

  const handleEmailSubmit = () => {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setEmailError('Enter a valid email address to continue.');
      return;
    }

    storage.setWalletMode('demo');
    storage.setWalletAddress(process.env.NEXT_PUBLIC_WALLET_ADDRESS || 'demo_user');
    storage.setUserEmail(normalized);
    continueToApp();
  };

  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-[#0a0a0f] px-5 py-6 text-slate-100 transition-all duration-300 ease-in-out md:px-10 ${
        isTransitioning ? 'scale-[1.02] opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-35 [background:linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] [background-size:54px_54px]" />
      <div className="pointer-events-none absolute -right-24 -top-16 h-[500px] w-[500px] rounded-full bg-[#7c3aed] opacity-15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-[400px] w-[400px] rounded-full bg-[#00c896] opacity-10 blur-[100px]" />
      <div className={`pointer-events-none absolute inset-0 bg-black/20 transition-opacity duration-300 ${focusDim ? 'opacity-100' : 'opacity-0'}`} />

      <div className="relative z-10 mx-auto max-w-7xl">
        <nav className="glass-card sticky top-3 z-20 mb-6 flex items-center justify-between rounded-2xl border-b px-5 py-3">
          <PaymanLogo size="md" />
          <div className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
            <span className="hover:text-white">Execution</span>
            <span className="hover:text-white">Policies</span>
            <span className="hover:text-white">Audit</span>
            <button onClick={onExecuteClick} className="rounded-full bg-[#00c896] px-4 py-1.5 text-xs font-semibold text-black">
              Launch App
            </button>
          </div>
        </nav>

        <section className="grid min-h-[88vh] items-center gap-8 md:grid-cols-2">
          <div className="animate-[fadeInUp_500ms_ease-out] space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00c896]/40 bg-[#00c896]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#00c896]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00c896] animate-[pulse_2s_ease-in-out_infinite]" />
              Live
            </div>

            <div>
              <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-[-0.03em] text-white md:text-[72px]">
                Autonomous payments.
                <br />
                That must <span className="underline decoration-[#00c896] decoration-4 underline-offset-4">justify</span> every action.
              </h1>
              <p className="mt-5 max-w-[480px] text-[18px] text-[#6b7280]">
                Every transaction is validated, enforced, and explained — before it executes.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="glass-card rounded-2xl px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">Validation</p>
                <p className="mt-1 text-base font-semibold text-white">{validationCount}-step validation</p>
              </div>
              <div className="glass-card rounded-2xl px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">Policy</p>
                <p className="mt-1 text-base font-semibold text-white">{policyCount}% policy-enforced</p>
              </div>
              <div className="glass-card rounded-2xl px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">Audit</p>
                <p className="mt-1 text-base font-semibold text-white">{auditCount}/24 Full audit trail</p>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onExecuteClick}
                  className={`rounded-full bg-[#00c896] px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:brightness-110 ${
                    ctaPressed ? 'scale-[0.98]' : 'scale-100'
                  }`}
                >
                  Execute with Payman
                </button>
                <button
                  onClick={onViewSystem}
                  className="rounded-full border border-white/20 bg-transparent px-6 py-3 text-sm text-white transition hover:bg-white/5"
                >
                  View System ↓
                </button>
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

          <div className="relative grid place-items-center">
            <div className="pointer-events-none absolute h-[300px] w-[300px] rounded-full bg-[#00c896] opacity-10 blur-[80px]" />
            <div className="animate-[float_5s_ease-in-out_infinite] relative h-[580px] w-[280px] rotate-[2deg] rounded-[44px] border-2 border-white/15 bg-[#0a0a0f] p-3 shadow-[0_0_60px_rgba(0,200,150,0.15),0_0_120px_rgba(124,58,237,0.1)]">
              <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-black/70" />
              <div className="h-full rounded-[34px] border border-white/10 bg-[#050508] p-4">
                <div className="text-center">
                  <div className="mx-auto flex w-fit items-center justify-center">
                    <PaymanLogo size="sm" />
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#6b7280]">Execution Engine</p>
                </div>
                <div className="glass-card mt-4 rounded-xl p-3 text-sm text-slate-100">Send 20 USDT to vendor for API sprint</div>
                <div className="mt-4 space-y-2 font-mono text-xs">
                  {EXECUTION_STEPS.map((step, idx) => {
                    const visible = visibleStepCount > idx;
                    const waiting = idx === EXECUTION_STEPS.length - 1;
                    return (
                      <p key={step} className={`${visible ? 'animate-[stepIn_300ms_ease-out] opacity-100' : 'opacity-35'} ${waiting ? 'text-amber-300' : 'text-[#00c896]'}`}>
                        {waiting ? '○' : '✓'} {step}
                      </p>
                    );
                  })}
                </div>
                <button className="mt-6 w-full rounded-full bg-[#00c896] py-2 text-sm font-semibold text-black">Authorized ✓</button>
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

      {showAuthModal ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-[#020617]/84 p-4 backdrop-blur-lg">
          <div className="animate-modal-gateway w-full max-w-md rounded-3xl border border-[#00c896]/35 bg-slate-950/92 p-6 shadow-2xl shadow-black/60">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Authentication</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-100">Access the Execution Engine</h2>
            <p className="mt-2 text-sm text-slate-400">Authenticate to initiate controlled payments.</p>

            {!showEmailForm ? (
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleConnectWallet}
                  disabled={authLoading}
                  className="w-full rounded-lg bg-gradient-to-r from-[#00c896] to-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(0,200,150,0.35)] transition hover:shadow-[0_16px_34px_rgba(0,200,150,0.45)] disabled:opacity-70"
                >
                  {authLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
                <button
                  onClick={() => {
                    setShowEmailForm(true);
                    setAuthError('');
                    setEmailError('');
                  }}
                  className="w-full rounded-lg border border-white/20 bg-white/[0.02] px-4 py-2.5 text-sm text-slate-100 transition hover:border-white/35"
                >
                  Continue with Email
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none ring-[#00c896] placeholder:text-slate-500 focus:ring-2"
                />
                <button
                  onClick={handleEmailSubmit}
                  className="w-full rounded-lg border border-white/20 bg-white/[0.02] px-4 py-2.5 text-sm text-slate-100 transition hover:border-white/35"
                >
                  Continue
                </button>
              </div>
            )}

            {authError ? <p className="mt-4 text-xs text-amber-300">{authError}</p> : null}
            {emailError ? <p className="mt-2 text-xs text-amber-300">{emailError}</p> : null}
            {!hasMetaMask ? <p className="mt-2 text-xs text-slate-500">MetaMask not installed. Email flow remains available.</p> : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
