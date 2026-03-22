import { Contract, HDNodeWallet, JsonRpcProvider, formatEther, formatUnits, parseUnits } from 'ethers';
import { SEPOLIA_EXPLORER } from './utils';

// USDC on Sepolia
export const TOKEN_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
export const TOKEN_DECIMALS = 6;
export const TOKEN_SYMBOL = 'USDC';

const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export interface WalletSnapshot {
  address: string;
  usdtBalance: string;
}

export interface TransferQuote {
  feeEth: string;
}

export interface TransferResult {
  txHash: string;
  explorerUrl: string;
  feeEth: string;
  fromAddress: string;
}

function getEnv() {
  const seed = process.env.WDK_SEED_PHRASE?.trim();
  const rpcUrl = process.env.ETHEREUM_RPC_URL?.trim();
  if (!seed) throw new Error('WDK_SEED_PHRASE is not configured');
  if (!rpcUrl) throw new Error('ETHEREUM_RPC_URL is not configured');
  return { seed, rpcUrl };
}

function getWallet() {
  const { seed, rpcUrl } = getEnv();
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = HDNodeWallet.fromPhrase(seed).connect(provider);
  return { wallet, provider };
}

export async function getWalletSnapshot(): Promise<WalletSnapshot> {
  const { wallet, provider } = getWallet();
  const address = wallet.address;
  const usdc = new Contract(TOKEN_ADDRESS, USDC_ABI, provider);
  const balance = await usdc.balanceOf(address) as bigint;
  const decimals = await usdc.decimals() as bigint;
  return {
    address,
    usdtBalance: Number(formatUnits(balance, decimals)).toFixed(2)
  };
}

export async function quoteUsdtTransfer(toAddress: string, amountUsdt: number): Promise<TransferQuote> {
  try {
    const { wallet, provider } = getWallet();
    const usdc = new Contract(TOKEN_ADDRESS, USDC_ABI, wallet);
    const decimals = await usdc.decimals() as bigint;
    const amountWei = parseUnits(amountUsdt.toString(), decimals);
    const gasEstimate = await usdc.transfer.estimateGas(toAddress, amountWei);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? BigInt(2_000_000_000);
    const feeWei = gasEstimate * gasPrice;
    return { feeEth: formatEther(feeWei) };
  } catch {
    return { feeEth: '0.00042' };
  }
}

export async function sendUsdtTransfer(
  toAddress: string,
  amountUsdt: number,
  _memo?: string
): Promise<TransferResult> {
  const { wallet } = getWallet();
  const fromAddress = wallet.address;
  const usdc = new Contract(TOKEN_ADDRESS, USDC_ABI, wallet);
  const decimals = await usdc.decimals() as bigint;
  const amountWei = parseUnits(amountUsdt.toString(), decimals);

  const tx = await usdc.transfer(toAddress, amountWei) as { hash: string; wait: () => Promise<{ hash: string; gasUsed: bigint; gasPrice?: bigint }> };
  const receipt = await tx.wait();

  const feeWei = receipt.gasUsed * (receipt.gasPrice ?? BigInt(0));

  return {
    txHash: receipt.hash,
    explorerUrl: `${SEPOLIA_EXPLORER}${receipt.hash}`,
    feeEth: formatEther(feeWei),
    fromAddress
  };
}

export async function getUsdtBalanceByAddress(address: string): Promise<string> {
  const { rpcUrl } = getEnv();
  const provider = new JsonRpcProvider(rpcUrl);
  const usdc = new Contract(TOKEN_ADDRESS, USDC_ABI, provider);
  const balance = await usdc.balanceOf(address) as bigint;
  const decimals = await usdc.decimals() as bigint;
  return Number(formatUnits(balance, decimals)).toFixed(2);
}

export function getNetworkLabel() {
  return 'Sepolia';
}

export function inferDemoMode(): boolean {
  return false;
}
