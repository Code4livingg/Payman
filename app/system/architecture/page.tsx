import Link from 'next/link';

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-[#030712] px-5 py-10 text-slate-100 md:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <h1 className="text-3xl font-semibold tracking-tight">Architecture</h1>
        <p className="mt-2 text-slate-300">Payman is layered to isolate intent parsing, policy validation, and execution decisions.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Control Plane</p>
            <p className="mt-2 text-sm text-slate-200">AI Agent + Policy Engine enforce deterministic safety checks before any payment request reaches execution.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Execution Plane</p>
            <p className="mt-2 text-sm text-slate-200">MetaMask/WDK transfer layer with explanation logging and transaction persistence.</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/70 p-4 font-mono text-sm text-emerald-200">
          User → AI Agent → Policy Engine → Explainability Layer → Wallet Execution
        </div>

        <Link href="/system" className="mt-6 inline-block text-sm text-emerald-300 hover:text-emerald-200">
          ← Back to System
        </Link>
      </div>
    </main>
  );
}
