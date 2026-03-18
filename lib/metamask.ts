'use client';

import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';

const ERC20_ABI = [
  'function transfer(address to, uint256 value) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)'
];

export type WalletMode = 'metamask' | 'demo';

function getEthereumProvider(): { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } | null {
  if (typeof window === 'undefined') return null;
  return (window as Window & { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } })
    .ethereum || null;
}

export function hasMetaMaskProvider(): boolean {
  const hasMetaMask = typeof window !== 'undefined' && (window as Window & { ethereum?: unknown }).ethereum;
  return Boolean(hasMetaMask);
}

export async function connectMetaMask(): Promise<{ address: string }> {
  const ethereum = getEthereumProvider();
  if (!ethereum) {
    throw new Error('MetaMask provider not found');
  }

  await ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new BrowserProvider(ethereum as never);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { address };
}

export async function getMetaMaskUsdtBalance(address: string): Promise<string> {
  const ethereum = getEthereumProvider();
  const token = process.env.NEXT_PUBLIC_SEPOLIA_USDT_ADDRESS;

  if (!ethereum || !token) return '0.00';

  const provider = new BrowserProvider(ethereum as never);
  const contract = new Contract(token, ERC20_ABI, provider);

  try {
    const balance = await contract.balanceOf(address);
    return Number(formatUnits(balance, 6)).toFixed(2);
  } catch {
    return '0.00';
  }
}

export async function sendUsdtWithMetaMask(toAddress: string, amountUsdt: number): Promise<{ txHash: string; explorerUrl: string }> {
  const ethereum = getEthereumProvider();
  const token = process.env.NEXT_PUBLIC_SEPOLIA_USDT_ADDRESS;

  if (!ethereum || !token) {
    throw new Error('MetaMask send unavailable. Missing provider or NEXT_PUBLIC_SEPOLIA_USDT_ADDRESS');
  }

  const provider = new BrowserProvider(ethereum as never);
  const signer = await provider.getSigner();
  const contract = new Contract(token, ERC20_ABI, signer);

  const tx = await contract.transfer(toAddress, parseUnits(String(amountUsdt), 6));
  await tx.wait();

  return {
    txHash: tx.hash,
    explorerUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`
  };
}

export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isMetaMaskUserRejected(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: number; message?: string };
  return candidate.code === 4001 || /rejected|denied/i.test(String(candidate.message || ''));
}
