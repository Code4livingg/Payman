import Link from 'next/link';

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-5 py-10 text-slate-100 md:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <h1 className="text-3xl font-semibold tracking-tight">Support</h1>
        <p className="mt-3 text-slate-300">Use these channels for demo issues, integration help, and system troubleshooting.</p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">General Support</p>
            <p className="mt-2 text-sm text-slate-200">support@payman.ai</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Technical Escalation</p>
            <p className="mt-2 text-sm text-slate-200">engineering@payman.ai</p>
          </div>
        </div>

        <Link href="/system" className="mt-6 inline-block text-sm text-emerald-300 hover:text-emerald-200">
          ← Back to System
        </Link>
      </div>
    </main>
  );
}
