import Link from 'next/link';

const cards = [
  { title: 'Architecture', href: '/system/architecture', text: 'Understand the execution stack and policy rails.' },
  { title: 'How It Works', href: '/system/how-it-works', text: 'See how command parsing, validation, and execution connect.' },
  { title: 'About', href: '/system/about', text: 'Learn the product vision behind controlled financial autonomy.' },
  { title: 'FAQ', href: '/system/faq', text: 'Answers to common questions about trust, safety, and reliability.' },
  { title: 'Support', href: '/system/support', text: 'Find support channels and escalation pathways.' }
];

export default function SystemPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-5 py-10 text-slate-100 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-700 bg-slate-950/80 p-7 shadow-2xl">
          <div className="pointer-events-none absolute right-[-120px] top-[-80px] h-64 w-64 rounded-full bg-emerald-400/20 blur-[90px]" />
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">System View</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Every decision is verified before money moves.</h1>
          <p className="mt-3 max-w-2xl text-slate-300">A policy-controlled AI execution engine for safe autonomous financial operations.</p>
          <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-[flowDrift_12s_ease-in-out_infinite]" />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200">AI command interpretation</div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200">Deterministic policy validation</div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200">Explainable transaction output</div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
          <h2 className="text-sm uppercase tracking-[0.16em] text-slate-400">Flow Diagram</h2>
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4 font-mono text-sm text-emerald-200">
            User → AI Agent → Policy Engine → Execution → Blockchain
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <h3 className="text-lg font-medium text-slate-100">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{card.text}</p>
              <Link href={card.href} className="mt-4 inline-block text-sm text-emerald-300 hover:text-emerald-200">
                Read More
              </Link>
            </article>
          ))}
        </section>

        <div>
          <Link href="/" className="rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2 text-sm text-slate-200 hover:border-white/30">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
