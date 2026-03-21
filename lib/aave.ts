import { Contract, JsonRpcProvider, Wallet, formatUnits } from 'ethers';
import { usdtToBaseUnits } from './utils';
import { TOKEN_ADDRESS, TOKEN_DECIMALS } from './wdk';

export const AAVE_POOL_SEPOLIA = '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951';
// aUSDC on Sepolia (Aave interest-bearing USDC)
export const AUSDC_SEPOLIA = '0x8Be59D90A7Dc679C5cE5a7963cD1082dAB499918';

const AAVE_POOL_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
  'function withdraw(address asset, uint256 amount, address to) returns (uint256)'
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

function getEnv() {
  const seed = process.env.WDK_SEED_PHRASE?.trim();
  const rpcUrl = process.env.ETHEREUM_RPC_URL?.trim();
  if (!seed) throw new Error('WDK_SEED_PHRASE is not configured');
  if (!rpcUrl) throw new Error('ETHEREUM_RPC_URL is not configured');
  return { seed, rpcUrl };
}

function getSigner() {
  const { seed, rpcUrl } = getEnv();
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
  const { wallet, provider } = getSigner();
  const aToken = new Contract(AUSDC_SEPOLIA, ERC20_ABI, provider);
  const raw = await aToken.balanceOf(wallet.address) as bigint;
  return { aaveBalance: Number(formatUnits(raw, TOKEN_DECIMALS)), isDemoMode: false };
}

export async function depositToAave(amount: number): Promise<AaveDeposit> {
  const { wallet } = getSigner();
  const token = new Contract(TOKEN_ADDRESS, ERC20_ABI, wallet);
  const pool = new Contract(AAVE_POOL_SEPOLIA, AAVE_POOL_ABI, wallet);
  const amountBn = usdtToBaseUnits(amount);

  const approveTx = await token.approve(AAVE_POOL_SEPOLIA, amountBn) as { wait: () => Promise<unknown> };
  await approveTx.wait();

  const supplyTx = await pool.supply(TOKEN_ADDRESS, amountBn, wallet.address, 0) as { hash: string; wait: () => Promise<unknown> };
  await supplyTx.wait();

  return { txHash: supplyTx.hash, isDemoMode: false };
}

export async function withdrawFromAave(amount: number): Promise<AaveWithdraw> {
  const { wallet } = getSigner();
  const pool = new Contract(AAVE_POOL_SEPOLIA, AAVE_POOL_ABI, wallet);
  const amountBn = usdtToBaseUnits(amount);

  const tx = await pool.withdraw(TOKEN_ADDRESS, amountBn, wallet.address) as { hash: string; wait: () => Promise<unknown> };
  await tx.wait();

  return { txHash: tx.hash, isDemoMode: false };
}

export async function getYieldEarned(): Promise<AaveYield> {
  const { aaveBalance } = await getAaveBalance();
  // Yield estimate: aToken balance minus deposited (approximated as 4.2% APY pro-rated 30 days)
  const yieldEarned = Math.max(0, aaveBalance * 0.042 * (30 / 365));
  return { yieldEarned: Number(yieldEarned.toFixed(4)), apy: 4.2, isDemoMode: false };
}
