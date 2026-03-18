'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { connectMetaMask, hasMetaMaskProvider, isMetaMaskUserRejected } from '@/lib/metamask';
import { storage } from '@/lib/storage';

const validationSteps = [
  'Checking policy...',
  'Budget verified (within policy limit)',
  'Vendor verified (on whitelist)',
  'Risk score: low (safe to execute)'
];

type ExecutionStatus = 'Pending' | 'Authorizing' | 'Approved';
type ExecutionPhase = 'idle' | 'analyzing' | 'processing';

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<ExecutionPhase>('idle');
  const [visibleLogs, setVisibleLogs] = useState(0);
  const [reasonVisible, setReasonVisible] = useState(false);
  const [status, setStatus] = useState<ExecutionStatus>('Pending');
  const [submitted, setSubmitted] = useState(false);
  const [submittedPulse, setSubmittedPulse] = useState(false);
  const [running, setRunning] = useState(true);
  const [focusDim, setFocusDim] = useState(false);
  const [ctaPressed, setCtaPressed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const runRef = useRef(0);

  const statusClass = useMemo(() => {
    if (status === 'Approved') return 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200';
    if (status === 'Authorizing') return 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100';
    return 'border-slate-500/40 bg-slate-500/10 text-slate-300';
  }, [status]);

  const onExecuteClick = () => {
    setCtaPressed(true);
    setFocusDim(true);
    setAuthError('');
    setEmailError('');
    setTimeout(() => setCtaPressed(false), 180);
    setStep(0);
    setRunId((prev) => prev + 1);
    setTimeout(() => {
      setShowEmailForm(false);
      setShowAuthModal(true);
      setFocusDim(false);
    }, 200);
  };

  useEffect(() => {
    if (runId === 0) return;
    runRef.current = runId;
    const currentRun = runRef.current;

    setRunning(true);
    setPhase('analyzing');
    setVisibleLogs(0);
    setReasonVisible(false);
    setStatus('Pending');
    setSubmitted(false);
    setSubmittedPulse(false);

    const timers: Array<ReturnType<typeof setTimeout>> = [];

    timers.push(
      setTimeout(() => {
        if (runRef.current !== currentRun) return;
        setStep(1);
        setPhase('processing');
        validationSteps.forEach((_, idx) => {
          timers.push(
            setTimeout(() => {
              if (runRef.current !== currentRun) return;
              setVisibleLogs(idx + 1);
            }, idx * 150)
          );
        });
      }, 360)
    );

    timers.push(
      setTimeout(() => {
        if (runRef.current !== currentRun) return;
        setStep(2);
        setReasonVisible(true);
      }, 1030)
    );

    timers.push(
      setTimeout(() => {
        if (runRef.current !== currentRun) return;
        setStep(3);
        setStatus('Authorizing');
      }, 1360)
    );

    timers.push(
      setTimeout(() => {
        if (runRef.current !== currentRun) return;
        setStatus('Approved');
      }, 1660)
    );

    timers.push(
      setTimeout(() => {
        if (runRef.current !== currentRun) return;
        setStep(4);
        setSubmitted(true);
        setSubmittedPulse(true);
      }, 1980)
    );

    timers.push(
      setTimeout(() => {
        if (runRef.current !== currentRun) return;
        setSubmittedPulse(false);
      }, 2320)
    );

    timers.push(
      setTimeout(() => {
        if (runRef.current !== currentRun) return;
        setRunning(false);
      }, 2600)
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [runId]);

  useEffect(() => {
    setHasMetaMask(hasMetaMaskProvider());
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = showAuthModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAuthModal]);

  const onViewSystem = () => {
    router.push('/system');
  };

  const continueToApp = () => {
    setShowAuthModal(false);
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/app');
    }, 320);
  };

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

  const handleContinueWithEmail = () => {
    setShowEmailForm(true);
    setAuthError('');
    setEmailError('');
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
      className={`relative min-h-screen overflow-hidden bg-gradient-to-b from-[#020617] via-[#030712] to-[#000000] px-5 py-7 transition-all duration-300 ease-in-out md:px-10 md:py-10 ${
        isTransitioning ? 'scale-[1.02] opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40 [background:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:58px_58px]" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.06] [background-image:radial-gradient(rgba(255,255,255,0.16)_0.6px,transparent_0.6px)] [background-size:3px_3px]" />
      <div className="pointer-events-none absolute right-[-180px] top-[-110px] z-0 h-[520px] w-[520px] rounded-full bg-emerald-400/20 blur-[120px] animate-[breatheGlow_7s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-[8%] top-[34%] z-0 h-[380px] w-[380px] rounded-full bg-cyan-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute left-[-100px] top-[32%] z-0 h-[300px] w-[300px] rounded-full bg-emerald-300/12 blur-[120px] animate-[breatheGlow_9s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-[16%] top-[64%] z-0 h-[240px] w-[240px] rounded-full bg-cyan-300/12 blur-[110px] animate-[breatheGlow_10s_ease-in-out_infinite]" />
      <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-45 animate-[flowDrift_16s_ease-in-out_infinite]" viewBox="0 0 1200 800" fill="none" aria-hidden>
        <path d="M580 170C760 176 906 250 1050 384" stroke="url(#flowA)" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M536 270C744 296 920 398 1086 572" stroke="url(#flowB)" strokeWidth="1.2" strokeLinecap="round" />
        <defs>
          <linearGradient id="flowA" x1="610" y1="170" x2="1040" y2="380" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(16,185,129,0)" />
            <stop offset="0.55" stopColor="rgba(45,212,191,0.68)" />
            <stop offset="1" stopColor="rgba(45,212,191,0)" />
          </linearGradient>
          <linearGradient id="flowB" x1="560" y1="260" x2="1070" y2="560" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(16,185,129,0)" />
            <stop offset="0.5" stopColor="rgba(16,185,129,0.56)" />
            <stop offset="1" stopColor="rgba(16,185,129,0)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,transparent_58%,rgba(2,6,23,0.36)_100%)]" />
      <div className={`pointer-events-none absolute inset-0 bg-black/20 transition-opacity duration-300 ease-in-out ${focusDim ? 'opacity-100' : 'opacity-0'}`} />

      <div className="relative z-10 mx-auto max-w-7xl">
        <nav className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative grid h-8 w-8 place-items-center rounded-md border border-white/20 bg-white/5">
              <span className="h-2.5 w-2.5 -translate-x-[2px] -translate-y-[2px] rounded-sm bg-emerald-300/90" />
              <span className="absolute h-2 w-2 translate-x-[5px] translate-y-[5px] rounded-sm border border-white/40 bg-white/10" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Payman</span>
          </div>
          <div className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
            <span>Execution</span>
            <span>Policies</span>
            <span>Audit</span>
          </div>
        </nav>

        <section id="system-section" className="grid items-center gap-y-10 md:grid-cols-[1.05fr_0.95fr] md:gap-x-20">
          <div className="relative z-10 max-w-[520px]">
            <div className="pointer-events-none absolute -left-10 top-6 -z-10 h-[250px] w-[250px] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.2)_0%,rgba(45,212,191,0.08)_42%,transparent_75%)] blur-[70px]" />
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Execution Engine Online</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-[-0.03em] text-white md:text-6xl">
              Autonomous payments.
              <br />
              That must justify every action.
            </h1>
            <p className="mt-5 max-w-[560px] text-base text-slate-300">
              Every transaction is validated, enforced, and explained — before it executes.
            </p>

            <div className="relative z-30 mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onExecuteClick}
                className={`rounded-lg bg-gradient-to-r from-emerald-400 via-emerald-400 to-teal-400 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-[0_12px_26px_rgba(16,185,129,0.32)] transition duration-300 ease-in-out hover:scale-[1.04] hover:shadow-[0_16px_34px_rgba(20,184,166,0.42)] ${ctaPressed ? 'scale-[0.98]' : ''}`}
              >
                Execute with Payman
              </button>
              <button
                onClick={onViewSystem}
                className="rounded-lg border border-white/15 bg-white/[0.03] px-5 py-2.5 text-sm text-slate-100 transition duration-300 ease-in-out hover:scale-[1.03] hover:border-white/30"
              >
                View System ↓
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">Every action is policy-verified before execution.</p>
          </div>

          <div className="pointer-events-none relative z-20 mx-auto w-full max-w-[430px] md:justify-self-end">
            <div className="absolute left-1/2 top-[47%] -z-10 h-[170px] w-[170px] -translate-x-1/2 rounded-full bg-teal-300/30 blur-[34px]" />
            <div className="absolute left-1/2 top-[46%] -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.24)_0%,rgba(14,116,144,0.16)_36%,rgba(14,116,144,0.08)_58%,transparent_76%)] blur-[85px]" />
            <div className="absolute left-1/2 top-[48%] -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-[130px]" />
            <div className="absolute left-1/2 top-[50%] -z-10 h-[420px] w-[580px] -translate-x-1/2 -rotate-[12deg] bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.2)_0%,rgba(20,184,166,0.08)_32%,transparent_72%)] blur-[86px]" />
            <div className="absolute -right-4 -top-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-300 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-[livePulse_2.2s_ease-in-out_infinite]" />
              Live • Policy Engine Active
            </div>
            <div className="absolute left-2 top-20 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 backdrop-blur-xl">
              Policy Check: PASSED
            </div>
            <div className="absolute -right-7 bottom-24 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 backdrop-blur-xl">
              Execution: Authorized
            </div>

            <div className="mx-auto w-[320px] scale-[1.02] rotate-[2deg] rounded-[38px] border border-white/20 bg-slate-900/85 p-3 shadow-[0_40px_120px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl transition duration-500 ease-in-out animate-[floatPhone_6s_ease-in-out_infinite]">
              <div className="h-[620px] rounded-[30px] border border-white/15 bg-gradient-to-b from-slate-800/92 to-slate-950/98 p-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <p className="text-sm font-medium text-slate-50">Payman Execution</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${running ? 'bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.9)]' : 'bg-slate-600'}`} />
                </div>

                <div className="mt-4 rounded-xl border border-white/15 bg-white/[0.05] p-3 text-sm text-slate-50">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Command</p>
                  <p className="mt-1 text-slate-100">Send 20 USDT to vendor</p>
                </div>

                <div className="mt-4 rounded-xl border border-white/15 bg-white/[0.05] p-3">
                  <p className="font-mono text-[11px] text-slate-300">
                    {phase === 'analyzing' ? 'Analyzing request...' : phase === 'processing' ? 'Processing request...' : 'Idle'}
                    {phase === 'analyzing' ? (
                      <span className="ml-1 inline-flex gap-0.5 align-middle">
                        <span className="h-1 w-1 animate-pulse rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                        <span className="h-1 w-1 animate-pulse rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                        <span className="h-1 w-1 animate-pulse rounded-full bg-slate-400" />
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {validationSteps.map((step, idx) => (
                      <p
                        key={step}
                        className={`font-mono text-[11px] transition-all duration-300 ease-in-out ${
                          visibleLogs > idx ? 'translate-y-0 text-emerald-200 opacity-100' : 'translate-y-1 text-slate-500 opacity-40'
                        }`}
                      >
                        {visibleLogs > idx ? `✔ ${step}` : `• ${step}`}
                      </p>
                    ))}
                  </div>
                  <p
                    className={`mt-2 text-[10px] text-slate-300 transition-all duration-300 ease-in-out ${
                      reasonVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                    }`}
                  >
                    Reason: Within spending policy and verified recipient
                  </p>
                </div>

                <div className={`mt-4 rounded-xl border p-3 transition-all duration-400 ease-in-out ${statusClass} ${status === 'Approved' ? 'shadow-[0_0_18px_rgba(16,185,129,0.25)]' : ''}`}>
                  <p className="text-xs">Status</p>
                  <p className="mt-1 text-base font-semibold">{status}</p>
                </div>

                <div
                  className={`mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200 transition-all duration-500 ease-in-out ${
                    submitted ? `translate-y-0 opacity-100 ${submittedPulse ? 'scale-[1.04] shadow-[0_0_28px_rgba(16,185,129,0.35)]' : 'scale-100'}` : 'translate-y-2 opacity-0'
                  }`}
                >
                  Transaction Submitted
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showAuthModal ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-[#020617]/84 p-4 backdrop-blur-lg">
          <div className="animate-modal-gateway w-full max-w-md rounded-3xl border border-teal-300/25 bg-slate-950/92 p-6 shadow-2xl shadow-black/60 ring-1 ring-teal-300/15 transition-all duration-300 ease-out">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Authentication</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-100">Access the Execution Engine</h2>
            <p className="mt-2 text-sm text-slate-400">Authenticate to initiate controlled payments.</p>

            {!showEmailForm ? (
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleConnectWallet}
                  disabled={authLoading}
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-[0_12px_28px_rgba(20,184,166,0.35)] transition duration-300 ease-in-out hover:scale-[1.02] hover:shadow-[0_16px_34px_rgba(20,184,166,0.45)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {authLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
                <button
                  onClick={handleContinueWithEmail}
                  className="w-full rounded-lg border border-white/20 bg-white/[0.02] px-4 py-2.5 text-sm text-slate-100 transition duration-300 ease-in-out hover:border-white/35 hover:bg-white/[0.05]"
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
                  className="w-full rounded-lg border border-white/20 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 outline-none ring-emerald-500 placeholder:text-slate-500 focus:ring-2"
                />
                <button
                  onClick={handleEmailSubmit}
                  className="w-full rounded-lg border border-white/20 bg-white/[0.02] px-4 py-2.5 text-sm text-slate-100 transition duration-300 ease-in-out hover:border-white/35 hover:bg-white/[0.05]"
                >
                  Continue
                </button>
              </div>
            )}

            {authError ? <p className="mt-4 text-xs text-amber-300">{authError}</p> : null}
            {emailError ? <p className="mt-2 text-xs text-amber-300">{emailError}</p> : null}

            {!hasMetaMask ? (
              <p className="mt-2 text-xs text-slate-500">MetaMask not installed. You can still continue in demo mode.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
