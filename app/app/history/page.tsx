'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import type { ChatSession } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    setSessions(storage.getChatSessions());
  }, []);

  return (
    <main className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl backdrop-blur-xl">
      <h1 className="text-xl font-semibold text-slate-100">Chat History</h1>
      <p className="mt-1 text-sm text-slate-400">Restore a previous conversation session.</p>

      <div className="mt-5 space-y-2">
        {!sessions.length && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border border-white/10 bg-white/[0.03]" />
            <p className="text-sm font-medium text-slate-200">No session history</p>
            <p className="mt-1 text-xs text-slate-500">Start a chat to create your first session.</p>
          </div>
        )}
        {sessions.map((session, index) => (
          <Link
            key={session.id}
            href={`/app?session=${session.id}`}
            className="block rounded-lg border border-slate-700 bg-slate-900/70 p-3 transition hover:border-emerald-500/40 hover:bg-emerald-500/10"
          >
            <p className="text-sm font-medium text-slate-100">Chat {sessions.length - index}</p>
            <p className="text-xs text-slate-400">{formatDate(session.timestamp)}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
