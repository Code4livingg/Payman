import { cn, formatDate } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';

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
          isUser && 'rounded-[18px_18px_4px_18px] border-[rgba(0,200,150,0.2)] bg-[rgba(0,200,150,0.15)] text-white',
          !isUser && !isSystem && 'rounded-[18px_18px_18px_4px] border-white/10 bg-white/[0.04] text-white',
          isSystem && !isFailure && !isProcessing && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
          isFailure && 'border-red-500/30 bg-red-500/10 text-red-100',
          isProcessing && 'border-amber-500/30 bg-amber-500/10 text-amber-100'
        )}
      >
        <p>{message.content}</p>
        <p className="mt-2 text-[11px] text-slate-400">{formatDate(message.createdAt)}</p>
      </div>
    </div>
  );
}
