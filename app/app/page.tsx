import { ChatInterface } from '@/components/ChatInterface';

export default function AppPage({ searchParams }: { searchParams?: { prefill?: string; session?: string } }) {
  return <ChatInterface prefill={searchParams?.prefill} sessionId={searchParams?.session} />;
}
