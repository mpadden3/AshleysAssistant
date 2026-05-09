# Deep Research — UI Test Findings (2026-05-09)

Tested live against `http://localhost:3000` via Chrome automation.

## Queries run

1. **Specific comparative**: "What are the main pricing differences between Anthropic Claude API and OpenAI GPT-5 API as of 2026?" — agent ran 2 `web_search` + 5 `read_url` steps and produced an 8-section report with an 8-card Sources grid.
2. **Ambiguous short**: "best framework" — agent replied with a clarifying question listing 10 domains, no search performed.

## Improvements, ranked by impact

### 1. Markdown tables render as raw pipes
The "Full Comparative Summary Table" and every per-section pricing table show up as literal `| Model | Standard Input | Cached Input | |---|---|---|` text. `react-markdown` is loaded but GFM is off.

**Fix:** add `remark-gfm` to `MessageView`'s ReactMarkdown `remarkPlugins`. Single biggest visual win — the model is trying to give tables and getting butchered.

### 2. Clarifying questions are a dead end
Once submitted, the input box disappears — only "New Search" remains. When the model asks for clarification (as it did on "best framework"), the user has to throw the conversation away and retype.

**Options:**
- Add a follow-up input that uses `useChat`'s `sendMessage` to continue the same conversation, OR
- Tell the model in `lib/system-prompt.ts` to never ask clarifying questions — make a reasonable assumption and proceed (fits the one-shot UX that exists).

### 3. Inline citations `[1][2]` are dead text
The body has `[1]`, `[2]`, `[4]` etc. as plain brackets. These should be `<a href="#source-1">` anchors that scroll to the matching Sources card — the source numbering is already aligned.

### 4. Stale "current date" in model output
The report opens with "verified against official sources as of late April 2026" — it's May 9. Inject `${new Date().toISOString().slice(0,10)}` into the system prompt so the model knows today's date.

### 5. No "synthesizing report" indicator
After the last tool returns and before markdown starts streaming there's a multi-second silent gap. A small "Compiling report…" line under the last tool card would prevent the "is it stuck?" feeling.

### 6. No copy/export of the finished report
Long reports like the one generated are exactly what users want to paste into a doc. A "Copy markdown" button next to "New Search" is a 10-line addition.

### 7. Long-report navigation
The pricing report had 8 numbered sections and required ~6 page-downs to read. A sticky right-rail TOC built from H2/H3 headings (or an auto-generated `<details>` jump list at the top) would help.

### 8. Source cards don't surface the actual cite text
Cards show the page's first paragraph, but the model already quoted specific facts — hovering a `[2]` could show the snippet that backed that claim. Lower priority; ties #3 and the existing `toolDataByUrl` data together.

## Minor

- Auto-scroll-to-bottom while streaming (you can be reading section 3 while section 7 is being written and never know it).
- Empty-submit guard — confirm `disabled={!input.trim()}` on the Research button.

## What's working well

- Agent loop, tool selection, tool-card streaming UI.
- Sources grid: 8 cards with favicons and snippets, numbering matches inline `[N]` markers.
- Streaming feels responsive; "Done" badge per tool call is clear.
- Typography on the report body is clean.
