'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface WalletData {
  address: string;
  signature: string;
}

interface WalletContextType {
  wallet: WalletData | null;
  setWallet: (wallet: WalletData | null) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWalletState] = useState<WalletData | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('payman_wallet');
      if (stored) {
        setWalletState(JSON.parse(stored) as WalletData);
      } else {
        // WDK wallet is always available — seed a session automatically
        const wdkSession: WalletData = {
          address: process.env.NEXT_PUBLIC_WALLET_ADDRESS || '0x67f1F74E42441294d3542C0A60f9665496aBC5a2',
          signature: 'wdk-internal'
        };
        setWalletState(wdkSession);
        localStorage.setItem('payman_wallet', JSON.stringify(wdkSession));
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const setWallet = (newWallet: WalletData | null) => {
    setWalletState(newWallet);
    if (newWallet) {
      localStorage.setItem('payman_wallet', JSON.stringify(newWallet));
    } else {
      localStorage.removeItem('payman_wallet');
    }
  };

  if (!hydrated) {
    return null;
  }

  return (
    <WalletContext.Provider value={{ wallet, setWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
