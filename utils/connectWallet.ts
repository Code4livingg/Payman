import { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface WalletConnection {
  provider: BrowserProvider;
  signer: JsonRpcSigner;
  address: string;
  signature: string;
}

export async function connectWallet(): Promise<WalletConnection> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    
    const accounts = await provider.send('eth_requestAccounts', []);
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    const message = 'Connect to Payman Treasury';
    const signature = await signer.signMessage(message);

    return {
      provider,
      signer,
      address,
      signature
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 4001) {
        throw new Error('User rejected connection');
      }
    }
    throw error;
  }
}
