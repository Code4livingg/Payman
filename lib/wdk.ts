import { Contract, HDNodeWallet, JsonRpcProvider, Wallet, formatEther, formatUnits } from 'ethers';
import { SEPOLIA_EXPLORER, usdtToBaseUnits } from './utils';

const ERC20_ABI = [
  'function transfer(address to, uint256 value) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)'
];

const DEMO_BALANCE = '1250.00';

export interface WalletSnapshot {
  address: string;
  usdtBalance: string;
  demo: boolean;
}

export interface TransferQuote {
  feeEth: string;
  demo: boolean;
}

export interface TransferResult {
  txHash: string;
  explorerUrl: string;
  feeEth: string;
  fromAddress: string;
  demo: boolean;
}

function getEnv() {
  return {
    seed: process.env.WDK_SEED_PHRASE,
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    defaultAddress: process.env.NEXT_PUBLIC_WALLET_ADDRESS,
    usdtToken: process.env.SEPOLIA_USDT_ADDRESS || process.env.NEXT_PUBLIC_SEPOLIA_USDT_ADDRESS
  };
}

function mockTxHash(): string {
  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

async function withWdkAccount<T>(
  fn: (account: { dispose: () => void; getAddress: () => Promise<string>; getTokenBalance: (token: string) => Promise<bigint>; quoteTransfer: (opts: { token: string; recipient: string; amount: bigint }) => Promise<{ fee: bigint }>; transfer: (opts: { token: string; recipient: string; amount: bigint }) => Promise<{ hash: string; fee: bigint }> }) => Promise<T>
): Promise<T> {
  const { seed, rpcUrl } = getEnv();
  if (!seed || !rpcUrl) {
    throw new Error('Missing WDK_SEED_PHRASE or ETHEREUM_RPC_URL');
  }

  const [{ default: WDK }, { default: WalletManagerEvm }] = await Promise.all([
    import('@tetherto/wdk'),
    import('@tetherto/wdk-wallet-evm')
  ]);

  const wdk = new WDK(seed).registerWallet('ethereum', WalletManagerEvm, {
    provider: rpcUrl
  });

  const account = await wdk.getAccount('ethereum', 0);

  try {
    return await fn(account);
  } finally {
    account.dispose();
  }
}

async function withEthersWallet<T>(fn: (wallet: HDNodeWallet, rpcUrl: string) => Promise<T>): Promise<T> {
  const { seed, rpcUrl } = getEnv();
  if (!seed || !rpcUrl) {
    throw new Error('Missing WDK_SEED_PHRASE or ETHEREUM_RPC_URL');
  }
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = Wallet.fromPhrase(seed).connect(provider);
  return fn(wallet, rpcUrl);
}

export async function getWalletSnapshot(): Promise<WalletSnapshot> {
  const env = getEnv();
  if (!env.seed || !env.rpcUrl || !env.usdtToken) {
    return {
      address: env.defaultAddress || 'Demo Wallet',
      usdtBalance: DEMO_BALANCE,
      demo: true
    };
  }

  try {
    const data = await withWdkAccount(async (account) => {
      const address = await account.getAddress();
      const tokenBalance = await account.getTokenBalance(env.usdtToken as string);
      return {
        address,
        usdtBalance: Number(formatUnits(tokenBalance, 6)).toFixed(2),
        demo: false
      };
    });

    return data;
  } catch {
    return {
      address: env.defaultAddress || 'Demo Wallet',
      usdtBalance: DEMO_BALANCE,
      demo: true
    };
  }
}

export async function quoteUsdtTransfer(toAddress: string, amountUsdt: number): Promise<TransferQuote> {
  const env = getEnv();

  if (!env.seed || !env.rpcUrl || !env.usdtToken) {
    return { feeEth: '0.00042', demo: true };
  }

  try {
    const quote = await withWdkAccount(async (account) => {
      const tx = await account.quoteTransfer({
        token: env.usdtToken as string,
        recipient: toAddress,
        amount: usdtToBaseUnits(amountUsdt)
      });
      return { feeEth: formatEther(tx.fee), demo: false };
    });
    return quote;
  } catch {
    return { feeEth: '0.00042', demo: true };
  }
}

export async function sendUsdtTransfer(
  toAddress: string,
  amountUsdt: number,
  memo?: string
): Promise<TransferResult> {
  const env = getEnv();

  if (!env.seed || !env.rpcUrl || !env.usdtToken) {
    const hash = mockTxHash();
    return {
      txHash: hash,
      explorerUrl: `${SEPOLIA_EXPLORER}${hash}`,
      feeEth: '0.00042',
      fromAddress: env.defaultAddress || 'Demo Wallet',
      demo: true
    };
  }

  try {
    const result = await withWdkAccount(async (account) => {
      const fromAddress = await account.getAddress();
      const tx = await account.transfer({
        token: env.usdtToken as string,
        recipient: toAddress,
        amount: usdtToBaseUnits(amountUsdt)
      });

      return {
        txHash: tx.hash,
        explorerUrl: `${SEPOLIA_EXPLORER}${tx.hash}`,
        feeEth: formatEther(tx.fee),
        fromAddress,
        demo: false
      };
    });

    return result;
  } catch {
    try {
      const ethersResult = await withEthersWallet(async (wallet, rpcUrl) => {
        const provider = new JsonRpcProvider(rpcUrl);
        const signer = wallet.connect(provider);
        const contract = new Contract(env.usdtToken as string, ERC20_ABI, signer);

        const tx = await contract.transfer(toAddress, usdtToBaseUnits(amountUsdt));
        const receipt = await tx.wait();
        const fee = receipt ? (receipt.gasUsed * receipt.gasPrice).toString() : '0';

        return {
          txHash: tx.hash,
          explorerUrl: `${SEPOLIA_EXPLORER}${tx.hash}`,
          feeEth: formatEther(BigInt(fee)),
          fromAddress: await signer.getAddress(),
          demo: false
        };
      });

      return ethersResult;
    } catch {
      const hash = mockTxHash();
      return {
        txHash: hash,
        explorerUrl: `${SEPOLIA_EXPLORER}${hash}`,
        feeEth: '0.00042',
        fromAddress: env.defaultAddress || 'Demo Wallet',
        demo: true
      };
    }
  }
}

export async function getUsdtBalanceByAddress(address: string): Promise<string> {
  const env = getEnv();
  if (!env.rpcUrl || !env.usdtToken) return DEMO_BALANCE;

  try {
    const provider = new JsonRpcProvider(env.rpcUrl);
    const contract = new Contract(env.usdtToken, ERC20_ABI, provider);
    const balance = await contract.balanceOf(address);
    return Number(formatUnits(balance, 6)).toFixed(2);
  } catch {
    return DEMO_BALANCE;
  }
}

export function getNetworkLabel() {
  return 'Sepolia';
}

export function inferDemoMode(): boolean {
  const env = getEnv();
  return !env.seed || !env.rpcUrl || !env.usdtToken;
}

export function getDemoTxHash() {
  return mockTxHash();
}
