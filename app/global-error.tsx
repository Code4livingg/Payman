'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  console.error('Global render error:', error);

  return (
    <html>
      <body style={{ backgroundColor: '#020617', color: '#e2e8f0', margin: 0 }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 640, width: '100%', border: '1px solid rgba(148,163,184,.35)', borderRadius: 16, padding: 24, background: 'rgba(2,6,23,.9)' }}>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f59e0b' }}>
              Global Recovery
            </p>
            <h1 style={{ margin: '10px 0 0', fontSize: 24 }}>Payman failed before route render.</h1>
            <p style={{ marginTop: 8, color: '#94a3b8' }}>Reset to restore application rendering.</p>
            <button
              onClick={reset}
              style={{ marginTop: 16, background: '#10b981', color: '#020617', borderRadius: 10, border: 'none', padding: '10px 14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Reset App
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
