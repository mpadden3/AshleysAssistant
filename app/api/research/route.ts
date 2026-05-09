import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { tools } from "@/lib/tools";
import { buildSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response("OPENROUTER_API_KEY is not set in .env.local", {
      status: 500,
    });
  }

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const result = streamText({
    model: openrouter("anthropic/claude-sonnet-4.6"),
    system: buildSystemPrompt(new Date().toISOString().slice(0, 10)),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
}
