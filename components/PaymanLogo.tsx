'use client';

export function PaymanLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { box: 24, font: 10, text: 14 },
    md: { box: 32, font: 13, text: 16 },
    lg: { box: 48, font: 18, text: 24 }
  } as const;
  const s = sizes[size];

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="grid place-items-center rounded-md bg-[#00c896] font-bold text-black shadow-[0_0_20px_rgba(0,200,150,0.25)]"
        style={{ width: s.box, height: s.box, fontSize: s.font }}
      >
        P
      </div>
      <span className="font-semibold text-white" style={{ fontSize: s.text }}>
        Payman
      </span>
    </div>
  );
}
