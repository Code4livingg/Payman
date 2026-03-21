import Anthropic from '@anthropic-ai/sdk';
import type { AgentResponse, DraftPayment } from './types';

const MODEL = 'claude-3-5-haiku-latest';

const SYSTEM_PROMPT = `You are Payman, an autonomous USDC payment agent.
Parse user messages and maintain a draftPayment object.
Always return JSON in this exact format:
{
  "type": "send"|"schedule"|"invoice"|"query"|"chat"|"update_draft"|"cancel",
  "draft": {"to_address": string, "amount_usdt": number, "memo": string} | null,
  "message": string,
  "ready_to_confirm": boolean
}
For multi-turn drafting:
- 'send 25 USDC to 0x...' -> set draft, ask for memo
- 'memo: salary' -> update draft memo, show full draft, ask confirm
- 'make it 20' -> update draft amount
- 'cancel' -> clear draft
Never execute payment yourself. Only return structured intent.`;

function parseJsonObject(content: string): AgentResponse | null {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(content.slice(start, end + 1)) as AgentResponse;
    if (!parsed.type || typeof parsed.message !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function runClaudeParser(input: string, draft: DraftPayment | null): Promise<AgentResponse | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `current_draft=${JSON.stringify(draft)}\nuser_message=${input}`
        }
      ]
    });

    const text = response.content
      .map((part) => (part.type === 'text' ? part.text : ''))
      .join('\n');

    return parseJsonObject(text);
  } catch {
    return null;
  }
}
