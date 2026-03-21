import type { Metadata } from 'next';
import { WalletProvider } from '@/context/WalletContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Payman',
  description: 'Autonomous USDC payment agent built on Tether WDK'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#020617', color: '#e2e8f0' }}>
        <WalletProvider>
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
          <div
            style={{
              position: 'absolute',
              inset: '6px',
              border: '1px solid rgba(0,200,150,0.12)',
              borderRadius: '16px',
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '10px',
              border: '1px solid rgba(0,200,150,0.05)',
              borderRadius: '12px',
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              width: 24,
              height: 24,
              borderTop: '2px solid #00c896',
              borderLeft: '2px solid #00c896',
              borderRadius: '4px 0 0 0',
              opacity: 0.8
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 24,
              height: 24,
              borderTop: '2px solid #00c896',
              borderRight: '2px solid #00c896',
              borderRadius: '0 4px 0 0',
              opacity: 0.8
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 14,
              width: 24,
              height: 24,
              borderBottom: '2px solid #00c896',
              borderLeft: '2px solid #00c896',
              borderRadius: '0 0 0 4px',
              opacity: 0.8
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              right: 14,
              width: 24,
              height: 24,
              borderBottom: '2px solid #00c896',
              borderRight: '2px solid #00c896',
              borderRadius: '0 0 4px 0',
              opacity: 0.8
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 17,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#00c896',
              opacity: 0.5
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 17,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#00c896',
              opacity: 0.5
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 17,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#00c896',
              opacity: 0.5
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 17,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#00c896',
              opacity: 0.5
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 32,
              fontSize: '10px',
              fontFamily: 'monospace',
              color: 'rgba(0,200,150,0.35)',
              letterSpacing: '0.1em'
            }}
          >
            PAYMAN v1.0 • WDK
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 32,
              fontSize: '10px',
              fontFamily: 'monospace',
              color: 'rgba(0,200,150,0.35)',
              letterSpacing: '0.1em'
            }}
          >
            SEPOLIA TESTNET
          </div>
        </div>
        {children}
        </WalletProvider>
      </body>
    </html>
  );
}
