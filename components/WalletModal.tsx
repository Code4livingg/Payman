'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { connectWallet } from '@/utils/connectWallet';
import { useWallet } from '@/context/WalletContext';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const router = useRouter();
  const { setWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConnect = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await connectWallet();
      
      setWallet({
        address: result.address,
        signature: result.signature
      });

      onClose();
      router.push('/app');
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'MetaMask not installed') {
          setError('MetaMask not detected. Please install MetaMask to continue.');
        } else if (err.message === 'User rejected connection') {
          setError('Connection rejected. Please approve to continue.');
        } else {
          setError('Connection failed. Please try again.');
        }
      } else {
        setError('Connection failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0f] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.8)] animate-[scaleIn_300ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 transition hover:text-white"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white">Connect Treasury Wallet</h2>
          <p className="mt-2 text-sm text-slate-400">
            Authentication required before executing autonomous payments.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full rounded-full bg-[#00c896] px-6 py-4 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed [background:linear-gradient(135deg,#00c896,#00a878)]"
        >
          {loading ? 'Connecting...' : 'Connect MetaMask'}
        </button>

        <p className="mt-4 text-center text-xs text-slate-500">
          By connecting, you agree to sign a message to verify wallet ownership.
        </p>
      </div>
    </div>
  );
}
