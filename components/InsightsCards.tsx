interface Props {
  totalSpent: number;
  last7DaysSpend: number;
  transactionCount: number;
}

function fmt(value: number) {
  return value.toFixed(2);
}

export function InsightsCards({ totalSpent, last7DaysSpend, transactionCount }: Props) {
  const cards = [
    { label: 'Total Spent', value: `${fmt(totalSpent)} USDT` },
    { label: 'Last 7 Days', value: `${fmt(last7DaysSpend)} USDT` },
    { label: 'Transactions', value: String(transactionCount) }
  ];

  return (
    <div className="grid gap-2">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">{card.label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
