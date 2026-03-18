import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-5 py-10 text-slate-100 md:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <h1 className="text-3xl font-semibold tracking-tight">About Payman</h1>
        <p className="mt-3 text-slate-300">
          Payman is an autonomous financial control system designed for policy-first execution. It allows AI-driven operations while enforcing
          strict guardrails and clear decision transparency.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">Controlled autonomy</div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">Explainable outcomes</div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">Policy enforcement</div>
        </div>
        <Link href="/system" className="mt-6 inline-block text-sm text-emerald-300 hover:text-emerald-200">
          ← Back to System
        </Link>
      </div>
    </main>
  );
}
