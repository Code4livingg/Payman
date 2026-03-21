import { Contract, JsonRpcProvider, formatEther, formatUnits } from 'ethers';
import { SEPOLIA_EXPLORER, usdtToBaseUnits } from './utils';

// USDC on Sepolia (has real liquidity, used for all transfers)
export const TOKEN_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
export const TOKEN_DECIMALS = 6;
export const TOKEN_SYMBOL = 'USDC';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
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

async function getWdkAccount() {
  const { seed, rpcUrl } = getEnv();

  const [{ default: WDK }, { default: WalletManagerEvm }] = await Promise.all([
    import('@tetherto/wdk'),
    import('@tetherto/wdk-wallet-evm')
  ]);

  const wdk = new WDK(seed).registerWallet('ethereum', WalletManagerEvm, {
    provider: rpcUrl
  });

  const account = await wdk.getAccount('ethereum', 0);
  return account;
}

export async function getWalletSnapshot(): Promise<WalletSnapshot> {
  const { rpcUrl } = getEnv();
  const account = await getWdkAccount();

  try {
    const address = await account.getAddress();
    const raw = await account.getTokenBalance(TOKEN_ADDRESS) as bigint;
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
    const balance = await contract.balanceOf(address) as bigint;

    return {
      address,
      usdtBalance: Number(formatUnits(balance, TOKEN_DECIMALS)).toFixed(2)
    };
  } finally {
    account.dispose();
  }
}

export async function quoteUsdtTransfer(toAddress: string, amountUsdt: number): Promise<TransferQuote> {
  const account = await getWdkAccount();

  try {
    const result = await account.quoteTransfer({
      token: TOKEN_ADDRESS,
      recipient: toAddress,
      amount: usdtToBaseUnits(amountUsdt)
    }) as { fee: bigint };

    return { feeEth: formatEther(result.fee) };
  } catch {
    // Quote is non-fatal — return gas estimate
    return { feeEth: '0.00042' };
  } finally {
    account.dispose();
  }
}

export async function sendUsdtTransfer(
  toAddress: string,
  amountUsdt: number,
  _memo?: string
): Promise<TransferResult> {
  const account = await getWdkAccount();

  try {
    const fromAddress = await account.getAddress();
    const amountBn = usdtToBaseUnits(amountUsdt);

    const result = await account.transfer({
      token: TOKEN_ADDRESS,
      recipient: toAddress,
      amount: amountBn
    }) as { hash: string; fee: bigint };

    return {
      txHash: result.hash,
      explorerUrl: `${SEPOLIA_EXPLORER}${result.hash}`,
      feeEth: formatEther(result.fee),
      fromAddress
    };
  } finally {
    account.dispose();
  }
}

export async function getUsdtBalanceByAddress(address: string): Promise<string> {
  const { rpcUrl } = getEnv();
  const provider = new JsonRpcProvider(rpcUrl);
  const contract = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
  const raw = await contract.balanceOf(address) as bigint;
  return Number(formatUnits(raw, TOKEN_DECIMALS)).toFixed(2);
}

export function getNetworkLabel() {
  return 'Sepolia';
}

export function inferDemoMode(): boolean {
  return false;
}
