import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Payman',
  description: 'Autonomous USDT payment agent built on Tether WDK'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#020617', color: '#e2e8f0' }}>{children}</body>
    </html>
  );
}
