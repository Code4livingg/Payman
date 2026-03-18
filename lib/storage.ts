'use client';

import { STORAGE_KEYS } from './utils';
import type { ActivityItem, ChatMessage, ChatSession, DraftPayment, Invoice, LocalTransaction, Policy, Schedule } from './types';

const defaultPolicy: Policy = {
  max_single_usdt: 100,
  daily_cap_usdt: 500,
  whitelist_enabled: false,
  whitelist: [],
  block_duplicate_mins: 5,
  require_memo: false
};

function getJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getMessages: () => getJSON<ChatMessage[]>(STORAGE_KEYS.messages, []),
  setMessages: (value: ChatMessage[]) => setJSON(STORAGE_KEYS.messages, value),

  getDraft: () => getJSON<DraftPayment | null>(STORAGE_KEYS.draft, null),
  setDraft: (value: DraftPayment | null) => setJSON(STORAGE_KEYS.draft, value),

  getPolicy: () => getJSON<Policy>(STORAGE_KEYS.policy, defaultPolicy),
  setPolicy: (value: Policy) => setJSON(STORAGE_KEYS.policy, value),
  getDefaultPolicy: () => defaultPolicy,

  getActivity: () => getJSON<ActivityItem[]>(STORAGE_KEYS.activity, []),
  setActivity: (value: ActivityItem[]) => setJSON(STORAGE_KEYS.activity, value),

  getSchedules: () => getJSON<Schedule[]>(STORAGE_KEYS.schedules, []),
  setSchedules: (value: Schedule[]) => setJSON(STORAGE_KEYS.schedules, value),

  getInvoices: () => getJSON<Invoice[]>(STORAGE_KEYS.invoices, []),
  setInvoices: (value: Invoice[]) => setJSON(STORAGE_KEYS.invoices, value),

  getWalletMode: () => getJSON<'metamask' | 'demo'>(STORAGE_KEYS.walletMode, 'demo'),
  setWalletMode: (value: 'metamask' | 'demo') => setJSON(STORAGE_KEYS.walletMode, value),

  getWalletAddress: () => getJSON<string>(STORAGE_KEYS.walletAddress, ''),
  setWalletAddress: (value: string) => setJSON(STORAGE_KEYS.walletAddress, value),

  getUserEmail: () => getJSON<string>(STORAGE_KEYS.userEmail, ''),
  setUserEmail: (value: string) => setJSON(STORAGE_KEYS.userEmail, value),

  getChatSessions: () => getJSON<ChatSession[]>(STORAGE_KEYS.chatSessions, []),
  setChatSessions: (value: ChatSession[]) => setJSON(STORAGE_KEYS.chatSessions, value),
  getActiveSession: () => getJSON<string>(STORAGE_KEYS.activeSession, ''),
  setActiveSession: (value: string) => setJSON(STORAGE_KEYS.activeSession, value),

  getLocalTransactions: () => getJSON<LocalTransaction[]>(STORAGE_KEYS.transactionsLocal, []),
  setLocalTransactions: (value: LocalTransaction[]) => setJSON(STORAGE_KEYS.transactionsLocal, value)
};
