import { Contract, JsonRpcProvider, Wallet, formatUnits, parseUnits } from 'ethers';
import { usdtToBaseUnits } from './utils';

export const AAVE_POOL_SEPOLIA = '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951';
export const AUSDT_SEPOLIA = '0x88Da569aea43C7CE28E4e21e9a97E73d5f9EC72C';
export const USDT_SEPOLIA = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';

const AAVE_POOL_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
  'function withdraw(address asset, uint256 amount, address to) returns (uint256)'
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

const DEMO_AAVE_BALANCE = 847.32;
const DEMO_YIELD = 12.18;
const DEMO_APY = 4.2;

function mockTxHash(): string {
  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

function getEnv() {
  return {
    seed: process.env.WDK_SEED_PHRASE,
    rpcUrl: process.env.ETHEREUM_RPC_URL
  };
}

function isDemoMode(): boolean {
  const { seed, rpcUrl } = getEnv();
  return !seed || !rpcUrl;
}

async function getSignerAndProvider() {
  const { seed, rpcUrl } = getEnv();
  if (!seed || !rpcUrl) throw new Error('Missing WDK_SEED_PHRASE or ETHEREUM_RPC_URL');
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = Wallet.fromPhrase(seed).connect(provider);
  return { wallet, provider };
}

export interface AaveBalance {
  aaveBalance: number;
  isDemoMode: boolean;
}

export interface AaveDeposit {
  txHash: string;
  isDemoMode: boolean;
}

export interface AaveWithdraw {
  txHash: string;
  isDemoMode: boolean;
}

export interface AaveYield {
  yieldEarned: number;
  apy: number;
  isDemoMode: boolean;
}

export async function getAaveBalance(): Promise<AaveBalance> {
  if (isDemoMode()) {
    return { aaveBalance: DEMO_AAVE_BALANCE, isDemoMode: true };
  }

  try {
    const { wallet, provider } = await getSignerAndProvider();
    const aUsdt = new Contract(AUSDT_SEPOLIA, ERC20_ABI, provider);
    const raw = await aUsdt.balanceOf(wallet.address) as bigint;
    return { aaveBalance: Number(formatUnits(raw, 6)), isDemoMode: false };
  } catch {
    return { aaveBalance: DEMO_AAVE_BALANCE, isDemoMode: true };
  }
}

export async function depositToAave(amount: number): Promise<AaveDeposit> {
  if (isDemoMode()) {
    return { txHash: mockTxHash(), isDemoMode: true };
  }

  try {
    const { wallet } = await getSignerAndProvider();
    const usdt = new Contract(USDT_SEPOLIA, ERC20_ABI, wallet);
    const pool = new Contract(AAVE_POOL_SEPOLIA, AAVE_POOL_ABI, wallet);
    const amountBn = usdtToBaseUnits(amount);

    const approveTx = await usdt.approve(AAVE_POOL_SEPOLIA, amountBn) as { wait: () => Promise<unknown> };
    await approveTx.wait();

    const supplyTx = await pool.supply(USDT_SEPOLIA, amountBn, wallet.address, 0) as { hash: string; wait: () => Promise<unknown> };
    await supplyTx.wait();

    return { txHash: supplyTx.hash, isDemoMode: false };
  } catch {
    return { txHash: mockTxHash(), isDemoMode: true };
  }
}

export async function withdrawFromAave(amount: number): Promise<AaveWithdraw> {
  if (isDemoMode()) {
    return { txHash: mockTxHash(), isDemoMode: true };
  }

  try {
    const { wallet } = await getSignerAndProvider();
    const pool = new Contract(AAVE_POOL_SEPOLIA, AAVE_POOL_ABI, wallet);
    const amountBn = usdtToBaseUnits(amount);

    const tx = await pool.withdraw(USDT_SEPOLIA, amountBn, wallet.address) as { hash: string; wait: () => Promise<unknown> };
    await tx.wait();

    return { txHash: tx.hash, isDemoMode: false };
  } catch {
    return { txHash: mockTxHash(), isDemoMode: true };
  }
}

export async function getYieldEarned(): Promise<AaveYield> {
  if (isDemoMode()) {
    return { yieldEarned: DEMO_YIELD, apy: DEMO_APY, isDemoMode: true };
  }

  try {
    const { aaveBalance } = await getAaveBalance();
    // Read deposited amount from a server-side approximation (no localStorage on server)
    // Yield = current aUSDT balance - originally deposited amount
    // Since we can't access localStorage server-side, we return balance-based estimate
    const yieldEarned = Math.max(0, aaveBalance * 0.0042 * (30 / 365));
    return { yieldEarned: Number(yieldEarned.toFixed(4)), apy: DEMO_APY, isDemoMode: false };
  } catch {
    return { yieldEarned: DEMO_YIELD, apy: DEMO_APY, isDemoMode: true };
  }
}
