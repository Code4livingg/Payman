import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const SEPOLIA_CHAIN_ID = 11155111;

export const STORAGE_KEYS = {
  messages: 'payman_messages',
  draft: 'payman_draft',
  policy: 'payman_policy',
  activity: 'payman_activity',
  schedules: 'payman_schedules',
  invoices: 'payman_invoices',
  walletMode: 'payman_wallet_mode',
  walletAddress: 'payman_wallet_address',
  userEmail: 'payman_user_email',
  chatSessions: 'payman_chat_sessions',
  activeSession: 'payman_active_session',
  transactionsLocal: 'payman_transactions'
} as const;

export const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io/tx/';

export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function shortenHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function plusDays(dateISO: string, days: number): string {
  const next = new Date(dateISO);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function computeNextRun(frequency: 'daily' | 'weekly' | 'monthly', currentISO: string): string {
  if (frequency === 'daily') return plusDays(currentISO, 1);
  if (frequency === 'weekly') return plusDays(currentISO, 7);
  const dt = new Date(currentISO);
  dt.setMonth(dt.getMonth() + 1);
  return dt.toISOString();
}

export function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

export function usdtToBaseUnits(amount: number): bigint {
  return BigInt(Math.round(amount * 1_000_000));
}

export function baseUnitsToUsdt(amount: bigint): number {
  return Number(amount) / 1_000_000;
}
