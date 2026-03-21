'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Copy, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import type { Policy } from '@/lib/types';
import { storage } from '@/lib/storage';

function getWalletId(): string {
  const fromStorage = storage.getWalletAddress();
  if (/^0x[a-fA-F0-9]{40}$/.test(fromStorage)) return fromStorage;
  return 'demo_user';
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function Toggle({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
        checked ? 'border-[#00c896]/50 bg-[#00c896]/20' : 'border-white/10 bg-white/[0.06]'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full transition ${
          checked ? 'translate-x-6 bg-[#00c896]' : 'translate-x-1 bg-slate-400'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [policy, setPolicy] = useState<Policy>(storage.getDefaultPolicy());
  const [walletId, setWalletId] = useState('demo_user');
  const [toast, setToast] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [whitelistLabels, setWhitelistLabels] = useState<Record<string, string>>({});
  const [autoAave, setAutoAave] = useState(false);
  const [aaveReserve, setAaveReserve] = useState(100);
  const [aaveThreshold, setAaveThreshold] = useState(200);

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
        // fall back to local policy
      }

      setPolicy(storage.getPolicy());
    };

    void loadPolicy();

    try {
      const raw = localStorage.getItem('payman_whitelist_labels');
      if (raw) setWhitelistLabels(JSON.parse(raw) as Record<string, string>);
    } catch {
      setWhitelistLabels({});
    }

    try {
      const savedAutoAave = localStorage.getItem('payman_auto_aave');
      if (savedAutoAave) setAutoAave(JSON.parse(savedAutoAave) as boolean);
      const savedReserve = localStorage.getItem('payman_aave_reserve');
      if (savedReserve) setAaveReserve(Number(savedReserve));
      const savedThreshold = localStorage.getItem('payman_aave_threshold');
      if (savedThreshold) setAaveThreshold(Number(savedThreshold));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const rulesActive = useMemo(
    () => 2 + (policy.require_memo ? 1 : 0) + (policy.whitelist_enabled ? 1 : 0) + (policy.block_duplicate_mins > 0 ? 1 : 0),
    [policy]
  );

  const preview = `Max: ${policy.max_single_usdt} USDC | Cap: ${policy.daily_cap_usdt} USDC | Whitelist: ${
    policy.whitelist_enabled ? 'ON' : 'OFF'
  }`;

  const persistLabels = (next: Record<string, string>) => {
    setWhitelistLabels(next);
    localStorage.setItem('payman_whitelist_labels', JSON.stringify(next));
  };

  const addWhitelistAddress = () => {
    const address = newAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return;
    if (policy.whitelist.includes(address)) return;

    setPolicy((prev) => ({ ...prev, whitelist: [...prev.whitelist, address] }));
    persistLabels({
      ...whitelistLabels,
      [address]: newLabel.trim() || `Recipient ${policy.whitelist.length + 1}`
    });
    setNewAddress('');
    setNewLabel('');
  };

  const removeWhitelistAddress = (address: string) => {
    setPolicy((prev) => ({ ...prev, whitelist: prev.whitelist.filter((entry) => entry !== address) }));
    const next = { ...whitelistLabels };
    delete next[address];
    persistLabels(next);
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setToast(`Copied ${truncateAddress(address)}`);
    } catch {
      setToast('Copy failed');
    }
  };

  const onSave = async () => {
    storage.setPolicy(policy);
    localStorage.setItem('payman_policy', JSON.stringify(policy));

    try {
      await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletId, policy })
      });
    } catch {
      // local persistence already applied
    }

    setToast(`Policy saved — ${rulesActive} rules active`);
  };

  return (
    <main className="min-h-screen bg-[#050508] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Policy Control Center</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Enterprise Policy Settings</h1>
            <p className="mt-2 text-sm text-slate-400">Configure transaction controls for wallet profile {walletId}.</p>
          </div>
          <Link
            href="/app"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-xs text-slate-200 transition hover:border-[#00c896]/30 hover:bg-white/[0.06]"
          >
            Back to app
          </Link>
        </div>

        <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(4,15,26,0.92),rgba(15,23,42,0.84))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Policy Summary</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Execution guardrails are live</h2>
              <p className="mt-3 font-mono text-sm text-slate-300">{preview}</p>
            </div>
            <div className="rounded-full border border-[#00c896]/30 bg-[#00c896]/10 px-4 py-2 font-mono text-xs text-[#7ef0c6]">
              Policy Active — {rulesActive} rules enforced
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Section 1</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Spending Limits</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm text-slate-300">Max single payment</span>
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <input
                    type="number"
                    value={policy.max_single_usdt}
                    onChange={(event) => setPolicy((prev) => ({ ...prev, max_single_usdt: Number(event.target.value || 0) }))}
                    className="w-full bg-transparent text-lg text-white outline-none"
                  />
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">USDC</span>
                </div>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Daily spending cap</span>
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <input
                    type="number"
                    value={policy.daily_cap_usdt}
                    onChange={(event) => setPolicy((prev) => ({ ...prev, daily_cap_usdt: Number(event.target.value || 0) }))}
                    className="w-full bg-transparent text-lg text-white outline-none"
                  />
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">USDC</span>
                </div>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
              <div>
                <p className="text-sm text-slate-100">Require memo on all payments</p>
                <p className="mt-1 text-xs text-slate-500">Every outgoing transfer must include a justification.</p>
              </div>
              <Toggle checked={policy.require_memo} onChange={() => setPolicy((prev) => ({ ...prev, require_memo: !prev.require_memo }))} />
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Section 2</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Recipient Controls</h2>
                <p className="mt-1 text-sm text-slate-500">Manage approved destinations and recipient labeling.</p>
              </div>
              <Toggle
                checked={policy.whitelist_enabled}
                onChange={() => setPolicy((prev) => ({ ...prev, whitelist_enabled: !prev.whitelist_enabled }))}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="grid gap-3 md:grid-cols-[1.4fr_0.9fr_auto]">
                <input
                  value={newAddress}
                  onChange={(event) => setNewAddress(event.target.value)}
                  placeholder="0x... recipient address"
                  className="rounded-2xl border border-white/10 bg-[#050508]/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#00c896]/40"
                />
                <input
                  value={newLabel}
                  onChange={(event) => setNewLabel(event.target.value)}
                  placeholder="Label"
                  className="rounded-2xl border border-white/10 bg-[#050508]/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#00c896]/40"
                />
                <button
                  onClick={addWhitelistAddress}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00c896] px-4 py-3 text-sm font-medium text-black transition hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {policy.whitelist.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-500">
                  No approved recipients yet.
                </div>
              ) : (
                policy.whitelist.map((address) => (
                  <div
                    key={address}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white">{whitelistLabels[address] || 'Unlabeled recipient'}</p>
                      <p className="mt-1 font-mono text-xs text-slate-400">{truncateAddress(address)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyAddress(address)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-slate-200 transition hover:border-[#00c896]/30"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                      <button
                        onClick={() => removeWhitelistAddress(address)}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-200 transition hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Section 3</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Duplicate Protection</h2>
              <p className="mt-1 text-sm text-slate-500">Prevent accidental repeat transfers within a short authorization window.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-[#00c896]" />
              Active
            </div>
          </div>

          <div className="mt-5 max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
            <label className="block">
              <span className="text-sm text-slate-300">Block duplicate payments within</span>
              <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-[#050508]/70 px-4 py-3">
                <input
                  type="number"
                  value={policy.block_duplicate_mins}
                  onChange={(event) => setPolicy((prev) => ({ ...prev, block_duplicate_mins: Number(event.target.value || 0) }))}
                  className="w-full bg-transparent text-lg text-white outline-none"
                />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">minutes</span>
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-[24px] border border-violet-500/20 bg-violet-500/[0.03] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-violet-400">Section 4</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Yield Strategy</h2>
              <p className="mt-1 text-sm text-slate-500">Auto-deposit idle USDC to Aave V3 on Sepolia to earn yield.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-2 font-mono text-xs text-violet-300">
              ~4.2% APY on Sepolia
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
            <div>
              <p className="text-sm text-slate-100">Auto-deposit idle funds to Aave</p>
              <p className="mt-1 text-xs text-slate-500">Automatically deposit USDC above the threshold to earn yield.</p>
            </div>
            <Toggle
              checked={autoAave}
              onChange={() => {
                const next = !autoAave;
                setAutoAave(next);
                localStorage.setItem('payman_auto_aave', JSON.stringify(next));
              }}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-300">Keep liquid reserve</span>
              <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <input
                  type="number"
                  value={aaveReserve}
                  onChange={(e) => {
                    const v = Number(e.target.value || 100);
                    setAaveReserve(v);
                    localStorage.setItem('payman_aave_reserve', String(v));
                  }}
                  className="w-full bg-transparent text-lg text-white outline-none"
                />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">USDC</span>
              </div>
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">Auto-deposit threshold</span>
              <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <input
                  type="number"
                  value={aaveThreshold}
                  onChange={(e) => {
                    const v = Number(e.target.value || 200);
                    setAaveThreshold(v);
                    localStorage.setItem('payman_aave_threshold', String(v));
                  }}
                  className="w-full bg-transparent text-lg text-white outline-none"
                />
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">USDC</span>
              </div>
            </label>
          </div>
        </section>

        <button
          onClick={onSave}
          className="w-full rounded-full bg-[#00c896] px-6 py-4 font-mono text-sm font-medium text-black transition hover:brightness-110"
        >
          Save Policy
        </button>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 rounded-full border border-[#00c896]/30 bg-[rgba(0,200,150,0.14)] px-4 py-2 font-mono text-xs text-[#7ef0c6] shadow-[0_14px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
