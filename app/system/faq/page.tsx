import Link from 'next/link';

const faqs = [
  {
    q: 'Does Payman execute payments automatically?',
    a: 'Only after validation and explicit confirmation or approved schedule triggers.'
  },
  {
    q: 'How are risky payments blocked?',
    a: 'Policy checks evaluate spend caps, whitelist rules, and duplicate windows.'
  },
  {
    q: 'Can I run without live blockchain dependencies?',
    a: 'Yes. Demo mode keeps flows functional when live services are unavailable.'
  }
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[#030712] px-5 py-10 text-slate-100 md:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
        <h1 className="text-3xl font-semibold tracking-tight">FAQ</h1>
        <div className="mt-6 space-y-3">
          {faqs.map((item) => (
            <article key={item.q} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
              <h2 className="text-sm font-medium text-slate-100">{item.q}</h2>
              <p className="mt-2 text-sm text-slate-300">{item.a}</p>
            </article>
          ))}
        </div>
        <Link href="/system" className="mt-6 inline-block text-sm text-emerald-300 hover:text-emerald-200">
          ← Back to System
        </Link>
      </div>
    </main>
  );
}
