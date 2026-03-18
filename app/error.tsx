'use client';

import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  console.error('App route error:', error);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950/85 p-6 text-slate-200">
        <p className="text-xs uppercase tracking-wider text-amber-300">Runtime Recovery</p>
        <h1 className="mt-2 text-xl font-semibold">Payman encountered a runtime error.</h1>
        <p className="mt-2 text-sm text-slate-400">The UI failed to render a route component. You can retry safely.</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={reset}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Retry Render
          </button>
          <Link href="/" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500">
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
