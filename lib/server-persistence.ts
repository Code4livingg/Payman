import type { Policy as AppPolicy } from './types';
import { db } from './db';

const FALLBACK_USER_ID = 'demo_user';

export function normalizeUserId(input?: string | null): string {
  const value = (input || '').trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(value)) return value.toLowerCase();
  return FALLBACK_USER_ID;
}

export function defaultPolicy(): AppPolicy {
  return {
    max_single_usdt: 100,
    daily_cap_usdt: 500,
    whitelist_enabled: false,
    whitelist: [],
    block_duplicate_mins: 5,
    require_memo: false
  };
}

export function dbPolicyToAppPolicy(policy: {
  maxSinglePayment: number;
  dailyLimit: number;
  requireMemo: boolean;
  whitelistEnabled: boolean;
}): AppPolicy {
  const defaults = defaultPolicy();
  return {
    ...defaults,
    max_single_usdt: policy.maxSinglePayment,
    daily_cap_usdt: policy.dailyLimit,
    require_memo: policy.requireMemo,
    whitelist_enabled: policy.whitelistEnabled
  };
}

export async function ensureUser(userIdRaw?: string | null): Promise<string> {
  const userId = normalizeUserId(userIdRaw);
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  });
  return userId;
}

export async function getOrCreatePolicy(userIdRaw?: string | null): Promise<AppPolicy> {
  const userId = await ensureUser(userIdRaw);
  const policy = await db.policy.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      maxSinglePayment: 100,
      dailyLimit: 500,
      requireMemo: false,
      whitelistEnabled: false
    }
  });

  return dbPolicyToAppPolicy(policy);
}

export async function updatePolicy(userIdRaw: string | null | undefined, policy: Partial<AppPolicy>): Promise<AppPolicy> {
  const userId = await ensureUser(userIdRaw);
  const existing = await getOrCreatePolicy(userId);

  const next: AppPolicy = {
    ...existing,
    ...policy,
    whitelist: Array.isArray(policy.whitelist) ? policy.whitelist : existing.whitelist,
    block_duplicate_mins:
      typeof policy.block_duplicate_mins === 'number' ? policy.block_duplicate_mins : existing.block_duplicate_mins
  };

  const record = await db.policy.upsert({
    where: { userId },
    update: {
      maxSinglePayment: next.max_single_usdt,
      dailyLimit: next.daily_cap_usdt,
      requireMemo: next.require_memo,
      whitelistEnabled: next.whitelist_enabled
    },
    create: {
      userId,
      maxSinglePayment: next.max_single_usdt,
      dailyLimit: next.daily_cap_usdt,
      requireMemo: next.require_memo,
      whitelistEnabled: next.whitelist_enabled
    }
  });

  return {
    ...next,
    ...dbPolicyToAppPolicy(record)
  };
}

export async function createTransaction(input: {
  userId: string;
  toAddress: string;
  amount: number;
  memo?: string;
  txHash: string;
  status: 'success' | 'failed' | 'demo';
}) {
  const userId = await ensureUser(input.userId);
  return db.transaction.create({
    data: {
      userId,
      toAddress: input.toAddress,
      amount: input.amount,
      memo: input.memo,
      txHash: input.txHash,
      status: input.status
    }
  });
}

export async function getTransactions(userIdRaw?: string | null) {
  const userId = await ensureUser(userIdRaw);
  return db.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getInsights(userIdRaw?: string | null) {
  const userId = await ensureUser(userIdRaw);
  const txs = await db.transaction.findMany({
    where: { userId, status: { in: ['success', 'demo'] } },
    select: { amount: true, createdAt: true }
  });

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const totalSpent = txs.reduce((sum, tx) => sum + tx.amount, 0);
  const last7DaysSpend = txs
    .filter((tx) => new Date(tx.createdAt).getTime() >= sevenDaysAgo)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    totalSpent,
    last7DaysSpend,
    transactionCount: txs.length
  };
}
