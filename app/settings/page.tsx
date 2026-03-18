'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Policy } from '@/lib/types';
import { storage } from '@/lib/storage';

function getWalletId(): string {
  const fromStorage = storage.getWalletAddress();
  if (/^0x[a-fA-F0-9]{40}$/.test(fromStorage)) return fromStorage;
  return 'demo_user';
}

export default function SettingsPage() {
  const [policy, setPolicy] = useState<Policy>(storage.getDefaultPolicy());
  const [whitelistInput, setWhitelistInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [walletId, setWalletId] = useState('demo_user');

  useEffect(() => {
    const currentWallet = getWalletId();
    setWalletId(currentWallet);

    const loadPolicy = async () => {
      try {
        const response = await fetch(`/api/policy?wallet=${encodeURIComponent(currentWallet)}`);
        const data = await response.json();
        if (data.ok && data.policy) {
          setPolicy(data.policy);
          storage.setPolicy(data.policy);
          return;
        }
      } catch {
        // fallback below
      }
      setPolicy(storage.getPolicy());
    };

    void loadPolicy();
  }, []);

  const onSave = async () => {
    storage.setPolicy(policy);
    try {
      await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletId, policy })
      });
    } catch {
      // Keep local policy fallback
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const onReset = async () => {
    const defaults = storage.getDefaultPolicy();
    setPolicy(defaults);
    storage.setPolicy(defaults);
    try {
      await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletId, policy: defaults })
      });
    } catch {
      // local fallback already applied
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Policy Guardrails</h1>
          <Link href="/app" className="text-sm text-emerald-300 hover:text-emerald-200">
            Back to app
          </Link>
        </div>
        <p className="mt-1 text-xs text-slate-500">Policy profile: {walletId}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Max single payment (USDT)
            <input
              type="number"
              value={policy.max_single_usdt}
              onChange={(event) => setPolicy((prev) => ({ ...prev, max_single_usdt: Number(event.target.value) }))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>

          <label className="text-sm text-slate-300">
            Daily spend cap (USDT)
            <input
              type="number"
              value={policy.daily_cap_usdt}
              onChange={(event) => setPolicy((prev) => ({ ...prev, daily_cap_usdt: Number(event.target.value) }))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>

          <label className="text-sm text-slate-300">
            Duplicate block window (minutes)
            <input
              type="number"
              value={policy.block_duplicate_mins}
              onChange={(event) => setPolicy((prev) => ({ ...prev, block_duplicate_mins: Number(event.target.value) }))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>

          <div className="flex flex-col justify-end gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <label className="flex items-center justify-between text-sm text-slate-300">
              Whitelist only
              <input
                type="checkbox"
                checked={policy.whitelist_enabled}
                onChange={(event) => setPolicy((prev) => ({ ...prev, whitelist_enabled: event.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-300">
              Require memo
              <input
                type="checkbox"
                checked={policy.require_memo}
                onChange={(event) => setPolicy((prev) => ({ ...prev, require_memo: event.target.checked }))}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm font-medium text-slate-200">Whitelist addresses (local fallback list)</p>
          <div className="mt-2 flex gap-2">
            <input
              value={whitelistInput}
              onChange={(event) => setWhitelistInput(event.target.value)}
              placeholder="0x..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                if (!whitelistInput.trim()) return;
                setPolicy((prev) => ({ ...prev, whitelist: [...prev.whitelist, whitelistInput.trim()] }));
                setWhitelistInput('');
              }}
              className="rounded-lg bg-emerald-500 px-3 py-2 text-sm text-slate-950 hover:bg-emerald-400"
            >
              Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {policy.whitelist.map((addr) => (
              <button
                key={addr}
                onClick={() => setPolicy((prev) => ({ ...prev, whitelist: prev.whitelist.filter((x) => x !== addr) }))}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-red-400"
              >
                {addr.slice(0, 10)}... remove
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onSave} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950">
            Save
          </button>
          <button onClick={onReset} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">
            Reset
          </button>
          {saved && <span className="self-center text-sm text-emerald-300">Saved</span>}
        </div>
      </div>
    </main>
  );
}
