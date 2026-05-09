@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Next.js version

This project uses Next.js 16.2.6 with React 19. APIs, conventions, and file structure may differ from your training data — heed `AGENTS.md` and read the relevant guide in `node_modules/next/dist/docs/` (split into `01-app/`, `02-pages/`, `03-architecture/`) before writing or modifying Next-specific code. Watch for deprecation notices in dev output.

## Critical: Vercel AI SDK v6

`package.json` pins `ai@^6.0.177` and `@ai-sdk/react@^3.0.179`. v6 has breaking changes from older SDK versions that are likely in your training data — `streamText`, `stepCountIs`, `convertToModelMessages`, `toUIMessageStreamResponse`, and the `tool-<name>` UI message part shape have all shifted. Verify imports and signatures against `node_modules/ai` and `node_modules/@ai-sdk/react` before guessing API shapes.

## Commands

```
npm run dev     # next dev — serves http://localhost:3000 (Turbopack is the default dev bundler in Next 15+)
npm run build   # next build
npm run start   # next start (production)
npm run lint    # eslint
```

There is no test framework configured.

## Environment

Both keys are required at runtime; the app reads from `.env.local`:

- `OPENROUTER_API_KEY` — checked inside `app/api/research/route.ts`; missing key returns a 500 from the route.
- `EXA_API_KEY` — `lib/exa.ts` throws at module load if absent, which means *any* import of `lib/tools.ts` (and therefore any build that touches the API route) will fail without it.

## Architecture

Single-page research agent: user submits a question, the model loops between web search and URL fetch tool calls, then streams a structured markdown report back to the UI.

**Request flow.** `components/research.tsx` (client) uses `useChat` from `@ai-sdk/react` with a `DefaultChatTransport` pointed at `/api/research`. The route in `app/api/research/route.ts` calls `streamText` from the `ai` package against OpenRouter's `anthropic/claude-sonnet-4.6`, supplies `lib/tools.ts` and `lib/system-prompt.ts`, and returns `result.toUIMessageStreamResponse()`. The agent loop is bounded by `stopWhen: stepCountIs(8)` and `export const maxDuration = 120`.

**Model provider.** The model is *not* called against `api.anthropic.com` — it is proxied through OpenRouter via `createOpenRouter` from `@openrouter/ai-sdk-provider`, billed via OpenRouter, and authed with `OPENROUTER_API_KEY`. A 401 from the route is an OpenRouter auth failure, not an Anthropic one.

**No auth, rate-limiting, or persistence.** The API route is unauthenticated and stateless; conversation history lives only in the client `useChat` state. There is no session layer, database, or queue to look for.

**Tools.** `lib/tools.ts` defines two tools, both backed by Exa (`lib/exa.ts`):
- `web_search` → `exa.searchAndContents` (excerpts up to 1500 chars, default 5 results)
- `read_url` → `exa.getContents` (full text up to 8000 chars)

Tool names are load-bearing on the client: `MessageView` matches `part.type === "tool-web_search"` and `"tool-read_url"` to render `ToolCallCard`s inline as the stream arrives. Renaming a tool requires updating both files.

**Output contract.** `lib/system-prompt.ts` instructs the model to end every report with a `## Sources` section formatted as `1. [Title](url)`. `splitBodyAndSources` in `components/research.tsx` parses that section with a regex and renders a `SourcesGrid`, enriching each card with snippet/title metadata pulled from the tool-result parts captured in `toolDataByUrl`. **Changing the heading, the numbered-link format, or the "Sources" wording will silently break the sources grid** even though the report still renders. Keep the system-prompt format and the parser in sync.

**Styling.** shadcn-style primitives in `components/ui` (style `base-nova`, neutral base color, CSS variables in `app/globals.css`). Path aliases per `tsconfig.json` / `components.json`: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
