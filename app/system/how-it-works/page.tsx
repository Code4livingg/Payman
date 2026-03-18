import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-5 py-10 text-slate-100 md:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <h1 className="text-3xl font-semibold tracking-tight">How It Works</h1>
        <div className="mt-6 space-y-3">
          {[
            '1. User submits a natural-language payment command.',
            '2. Agent converts command into structured intent and draft.',
            '3. Policy engine validates limits, duplicates, and recipient controls.',
            '4. Payment is executed only after validation and confirmation.',
            '5. Explainability layer records why it was approved or blocked.'
          ].map((step) => (
            <p key={step} className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
              {step}
            </p>
          ))}
        </div>
        <Link href="/system" className="mt-6 inline-block text-sm text-emerald-300 hover:text-emerald-200">
          ← Back to System
        </Link>
      </div>
    </main>
  );
}
