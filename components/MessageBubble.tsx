import { cn, formatDate } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';

function shortenHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const text = message.content.toLowerCase();
  const isFailure = isSystem && /(failed|error|blocked|rejected|declined|overdue)/i.test(text);
  const isProcessing = isSystem && /(processing|authorizing|pending|thinking)/i.test(text);

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm md:max-w-[70%]',
          isUser && 'rounded-[18px_18px_4px_18px] text-white',
          isUser && '[background:linear-gradient(135deg,rgba(0,200,150,0.15),rgba(124,58,237,0.10))] [border:1px_solid_rgba(0,200,150,0.25)]',
          !isUser && !isSystem && 'rounded-[18px_18px_18px_4px] text-white [background:rgba(255,255,255,0.04)] [border:1px_solid_rgba(255,255,255,0.08)]',
          isSystem && !isFailure && !isProcessing && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
          isFailure && 'border-red-500/30 bg-red-500/10 text-red-100',
          isProcessing && 'border-amber-500/30 bg-amber-500/10 text-amber-100'
        )}
      >
        <p>{message.content}</p>

        {message.txHash && (
          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono text-[11px] text-emerald-400/70">
              {shortenHash(message.txHash)}
            </span>
            <a
              href={`https://sepolia.etherscan.io/tx/${message.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 transition hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:shadow-[0_0_8px_rgba(52,211,153,0.25)]"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              View on Etherscan
            </a>
          </div>
        )}

        <p className="mt-2 text-[11px] text-slate-400">{formatDate(message.createdAt)}</p>
      </div>
    </div>
  );
}
