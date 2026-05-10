"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SUGGESTED_INQUIRIES = [
  "Brief me on Snowflake vs Databricks.",
  "What is retrieval-augmented generation (RAG)?",
  "Top Customer Data Platform vendors today.",
];

const ISSUE_LABEL = "PERSONAL RESEARCH DESK  ·  EST. 07/22/1996";

export function Research() {
  const [input, setInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const stickToBottom = useRef(true);
  const theme = useTheme();

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
  };

  const research = useChat({
    transport: new DefaultChatTransport({ api: "/api/research" }),
  });
  const company = useChat({
    transport: new DefaultChatTransport({ api: "/api/company-background" }),
  });

  const activeMode: "research" | "company" | null =
    research.messages.length > 0
      ? "research"
      : company.messages.length > 0
        ? "company"
        : null;
  const active = activeMode === "company" ? company : research;
  const messages = active.messages;
  const status = active.status;
  const error = active.error;

  const hasStarted = activeMode !== null;
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!isBusy) return;
    const onScroll = () => {
      const distanceFromBottom =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);
      stickToBottom.current = distanceFromBottom < 240;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isBusy]);

  useEffect(() => {
    if (!isBusy) return;
    if (!stickToBottom.current) return;
    window.scrollTo({ top: document.documentElement.scrollHeight });
  }, [messages, isBusy]);

  const submit = (text: string) => {
    const query = text.trim();
    if (!query || isBusy) return;
    stickToBottom.current = true;
    research.sendMessage({ text: query });
  };

  const submitCompany = (text: string) => {
    const query = text.trim();
    if (!query || isBusy) return;
    stickToBottom.current = true;
    company.sendMessage({ text: query });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
    setInput("");
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCompany(companyInput);
    setCompanyInput("");
  };

  const handleFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    const query = followUp.trim();
    if (!query || isBusy) return;
    stickToBottom.current = true;
    active.sendMessage({ text: query });
    setFollowUp("");
  };

  const handleReset = () => {
    research.setMessages([]);
    company.setMessages([]);
    setInput("");
    setCompanyInput("");
    setFollowUp("");
    setCopyState("idle");
  };

  const fullMarkdown = useMemo(
    () =>
      messages
        .filter((m) => m.role === "assistant")
        .map((m) =>
          m.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as { text: string }).text)
            .join(""),
        )
        .filter((t) => t.trim().length > 0)
        .join("\n\n---\n\n"),
    [messages],
  );

  const handleCopy = async () => {
    if (!fullMarkdown.trim()) return;
    try {
      await navigator.clipboard.writeText(fullMarkdown);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1500);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const compiling =
    status === "streaming" &&
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some((p) => p.type.startsWith("tool-")) &&
    !lastMessage.parts.some(
      (p) =>
        p.type === "text" && (p as { text: string }).text.trim().length > 0,
    );

  if (!hasStarted) {
    return (
      <main className="min-h-screen flex flex-col">
        <Masthead
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogoClick={handleReset}
        />

        <section className="mx-auto w-full max-w-5xl flex-1 px-6 pt-8 pb-16 md:pt-12">
          <div className="stagger flex flex-col gap-7">
            <div className="flex items-baseline justify-between gap-4">
              <span className="eyebrow eyebrow-accent">
                At your service
              </span>
              <span className="eyebrow hidden md:inline">
                For Ashley · sourced &amp; on the record
              </span>
            </div>

            <h1 className="font-display text-[clamp(2.5rem,6.5vw,4.75rem)] leading-[0.95] tracking-[-0.025em] text-foreground">
              <span className="block">
                <span
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1' }}
                >
                  Ashley&rsquo;s
                </span>{" "}
                <span
                  className="italic text-[var(--accent)]"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 90, "WONK" 1' }}
                >
                  Assistant,
                </span>
              </span>
              <span
                className="block"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 0', fontWeight: 300 }}
              >
                at your desk.
              </span>
            </h1>

            <Asterism />

            <div className="grid gap-10 md:grid-cols-[1fr_1.35fr] md:gap-14">
              <div className="flex flex-col gap-3">
                <span className="eyebrow">A note from your assistant</span>
                <p className="font-body text-lg leading-relaxed text-foreground/85">
                  I&rsquo;m your personal assistant — here to help you
                  research client companies, decode tech lingo, size up
                  competitors, and prep for your next call. Ask me
                  anything; I&rsquo;ll comb the open web and bring back a
                  briefing, fully sourced.
                </p>
                <div className="mt-6">
                  <span className="eyebrow">A few things I can look into</span>
                  <ul className="mt-3 flex flex-col">
                    {SUGGESTED_INQUIRIES.map((q, i) => (
                      <li
                        key={q}
                        className="border-t border-[var(--rule)] last:border-b"
                      >
                        <button
                          type="button"
                          onClick={() => submit(q)}
                          className="group flex w-full items-baseline gap-4 py-3 text-left transition-colors hover:bg-[color-mix(in_oklch,var(--accent)_8%,transparent)]"
                        >
                          <span className="font-mono text-[0.7rem] tracking-[0.18em] text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="font-body text-base italic leading-snug text-foreground/85 group-hover:text-foreground">
                            {q}
                          </span>
                          <span className="ml-auto font-mono text-[0.7rem] tracking-[0.18em] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            FILE →
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow eyebrow-accent">
                    Ask Ashley&rsquo;s assistant
                  </span>
                  <span className="eyebrow">No. 0001</span>
                </div>
                <div className="notepad">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What can I look into for you, Ashley?"
                    rows={6}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 pt-1">
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Return to send · ⇧↵ for new line
                  </span>
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="group inline-flex items-center gap-3 border border-foreground bg-foreground px-5 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-background transition-all hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:cursor-not-allowed disabled:border-[var(--rule)] disabled:bg-transparent disabled:text-muted-foreground"
                  >
                    <span>On it</span>
                    <span className="transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0">
                      →
                    </span>
                  </button>
                </div>
              </form>
            </div>

            <div className="border-t border-[var(--rule)] pt-10 grid gap-10 md:grid-cols-[1fr_1.35fr] md:gap-14">
              <div className="flex flex-col gap-3">
                <span className="eyebrow">Briefings desk</span>
                <p className="font-body text-lg leading-relaxed text-foreground/85">
                  Just need a quick read on a company? Drop a name and
                  I&rsquo;ll pull together a short briefing — industry,
                  revenue, headcount, leadership, and recent news, all
                  sourced.
                </p>
              </div>

              <form
                onSubmit={handleCompanySubmit}
                className="flex flex-col gap-4"
              >
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow eyebrow-accent">
                    Company Background
                  </span>
                  <span className="eyebrow">No. 0002</span>
                </div>
                <div className="notepad">
                  <textarea
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    placeholder="Company name (e.g. Snowflake)"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCompanySubmit(e);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 pt-1">
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Return to brief · ⇧↵ for new line
                  </span>
                  <button
                    type="submit"
                    disabled={!companyInput.trim()}
                    className="group inline-flex items-center gap-3 border border-foreground bg-foreground px-5 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-background transition-all hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:cursor-not-allowed disabled:border-[var(--rule)] disabled:bg-transparent disabled:text-muted-foreground"
                  >
                    <span>Brief me</span>
                    <span className="transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0">
                      →
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <Colophon />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Masthead
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogoClick={handleReset}
        compact
      >
        <button
          type="button"
          onClick={handleCopy}
          disabled={isBusy || !fullMarkdown.trim()}
          className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copyState === "copied"
            ? "Copied ✓"
            : copyState === "error"
              ? "Copy failed"
              : "Copy notes"}
        </button>
        <span className="text-[var(--rule)]">·</span>
        <button
          type="button"
          onClick={handleReset}
          disabled={isBusy}
          className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start fresh
        </button>
      </Masthead>

      <section className="mx-auto w-full max-w-3xl flex-1 px-6 pt-10 pb-40">
        <div className="flex flex-col gap-12">
          {messages.map((message) => (
            <MessageView key={message.id} message={message} />
          ))}

          {status === "submitted" && (
            <div className="flex items-center gap-3 fade-up">
              <span className="ink-dot" />
              <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground">
                Looking into it…
              </span>
            </div>
          )}

          {compiling && (
            <div className="flex items-center gap-3 fade-up">
              <span className="ink-dot" />
              <span className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground">
                Writing up your briefing…
              </span>
            </div>
          )}

          {error && (
            <div className="border border-destructive/40 bg-[color-mix(in_oklch,var(--destructive)_8%,transparent)] px-5 py-4">
              <div className="eyebrow text-destructive">Erratum</div>
              <p className="mt-1 font-body text-base text-foreground">
                {error.message}
              </p>
            </div>
          )}
        </div>
      </section>

      <form
        onSubmit={handleFollowUp}
        className="sticky bottom-0 z-20 mt-2 border-t border-[var(--rule)] bg-background/90 backdrop-blur-md"
      >
        <div className="mx-auto w-full max-w-3xl px-6 py-4">
          <div className="flex items-center justify-between pb-2">
            <span className="eyebrow eyebrow-accent">
              Anything else, Ashley?
            </span>
            <span className="eyebrow">⏎ to send</span>
          </div>
          <div className="notepad">
            <textarea
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder={
                isBusy ? "Working on it…" : "Ask a follow-up — I have the full thread in mind."
              }
              rows={2}
              disabled={isBusy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleFollowUp(e);
                }
              }}
            />
          </div>
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isBusy || !followUp.trim()}
              className="group inline-flex items-center gap-3 border border-foreground bg-foreground px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-background transition-all hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:cursor-not-allowed disabled:border-[var(--rule)] disabled:bg-transparent disabled:text-muted-foreground"
            >
              <span>Send</span>
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Masthead                                                            */
/* ------------------------------------------------------------------ */

function Masthead({
  theme,
  onToggleTheme,
  onLogoClick,
  compact,
  children,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogoClick?: () => void;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <header
      className={`sticky top-0 z-30 border-b border-[var(--rule)] bg-background/90 backdrop-blur-md`}
    >
      <div
        className={`mx-auto flex w-full ${compact ? "max-w-5xl py-2.5" : "max-w-6xl py-3"} items-center justify-between gap-6 px-6`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onLogoClick}
            aria-label="Start fresh"
            className="font-display text-xl tracking-tight text-foreground transition-opacity hover:opacity-70 cursor-pointer"
            style={{ fontVariationSettings: '"opsz" 18, "SOFT" 30, "WONK" 0' }}
          >
            Ashley&rsquo;s
            <span className="italic text-[var(--accent)]"> Assistant</span>
          </button>
          <span className="hidden sm:inline text-[var(--rule)]">·</span>
          <span className="hidden sm:block overflow-hidden whitespace-nowrap font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
            {ISSUE_LABEL}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {children}
          {children && <span className="text-[var(--rule)]">·</span>}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <span suppressHydrationWarning>
              {theme === "dark" ? "Day" : "Night"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Asterism() {
  return (
    <div className="asterism">
      <span className="glyph">✦ ✦ ✦</span>
    </div>
  );
}

function Colophon() {
  return (
    <footer className="border-t border-[var(--rule)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
          For Ashley · Est. 07/22/1996
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
          Set in Fraunces &amp; Newsreader
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground hidden sm:inline">
          Powered by Claude · OpenRouter · Exa
        </span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Message rendering                                                   */
/* ------------------------------------------------------------------ */

type Message = ReturnType<typeof useChat>["messages"][number];

type SourceMeta = {
  title?: string;
  url: string;
  text?: string;
  publishedDate?: string | null;
};

type ParsedSource = {
  index: number;
  title: string;
  url: string;
};

type Heading = {
  level: 2 | 3;
  text: string;
  id: string;
};

function MessageView({ message }: { message: Message }) {
  const toolDataByUrl = useMemo(() => {
    const map = new Map<string, SourceMeta>();
    for (const part of message.parts) {
      if (
        part.type === "tool-web_search" &&
        (part as ToolPart).state === "output-available"
      ) {
        const output = (part as ToolPart).output as
          | { results?: SourceMeta[] }
          | undefined;
        for (const r of output?.results ?? []) {
          if (r.url && !map.has(r.url)) map.set(r.url, r);
        }
      }
      if (
        part.type === "tool-read_url" &&
        (part as ToolPart).state === "output-available"
      ) {
        const output = (part as ToolPart).output as SourceMeta | undefined;
        if (output?.url) map.set(output.url, output);
      }
    }
    return map;
  }, [message.parts]);

  if (message.role === "user") {
    const text = message.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { text: string }).text)
      .join("");
    return (
      <div className="flex flex-col gap-3 fade-up">
        <div className="flex items-center gap-3">
          <span className="eyebrow eyebrow-accent">Inquiry</span>
          <span className="rule-thin flex-1" />
        </div>
        <p
          className="font-display italic text-[1.65rem] leading-snug text-foreground"
          style={{ fontVariationSettings: '"opsz" 36, "SOFT" 60, "WONK" 1' }}
        >
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          const { body, sources } = splitBodyAndSources(part.text);
          const sourceMetaByIndex = new Map<number, SourceMeta | undefined>();
          for (const s of sources) {
            sourceMetaByIndex.set(s.index, toolDataByUrl.get(s.url));
          }
          const linkedBody = linkifyCitations(body, sourceMetaByIndex);
          const headings = parseHeadings(body);
          const wordCount = body
            .replace(/[#>*_`\[\]()]/g, " ")
            .split(/\s+/)
            .filter(Boolean).length;

          return (
            <div key={i} className="flex flex-col gap-7 ink-rise">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="eyebrow eyebrow-accent">Dispatch</span>
                {wordCount > 0 && (
                  <span className="eyebrow">
                    {wordCount.toLocaleString()} words
                  </span>
                )}
                {sources.length > 0 && (
                  <span className="eyebrow">
                    {sources.length} source{sources.length === 1 ? "" : "s"}
                  </span>
                )}
                <span className="rule-thin flex-1" />
              </div>

              {sources.length > 0 && (
                <Sources sources={sources} meta={toolDataByUrl} />
              )}

              {headings.length >= 3 && <TableOfContents headings={headings} />}

              {sources.length > 0 && <Asterism />}

              <article className="report-prose">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children, ...props }) => (
                      <h2 id={slugify(extractText(children))} {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 id={slugify(extractText(children))} {...props}>
                        {children}
                      </h3>
                    ),
                  }}
                >
                  {linkedBody}
                </ReactMarkdown>
              </article>
            </div>
          );
        }
        if (part.type === "tool-web_search") {
          return <FieldNote key={i} label="Search" part={part as ToolPart} />;
        }
        if (part.type === "tool-read_url") {
          return <FieldNote key={i} label="Read" part={part as ToolPart} />;
        }
        return null;
      })}
    </div>
  );
}

type ToolPart = {
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function FieldNote({ label, part }: { label: string; part: ToolPart }) {
  const input = part.input as { query?: string; url?: string } | undefined;
  const summary = input?.query ?? input?.url ?? "…";
  const done = part.state === "output-available";
  const failed = part.state === "output-error";
  const status = failed ? "FAILED" : done ? "FILED" : "AT WORK";
  const statusColor = failed
    ? "text-destructive"
    : done
      ? "text-muted-foreground"
      : "text-[var(--accent)]";

  return (
    <div className="fade-up flex items-center gap-4 border-l-2 border-[var(--rule)] pl-4 py-2">
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-foreground/70">
        {label}
      </span>
      <span className="text-[var(--rule)]">·</span>
      <span className="min-w-0 flex-1 truncate font-body text-sm italic text-foreground/85">
        {summary}
      </span>
      <span
        className={`font-mono text-[0.62rem] uppercase tracking-[0.22em] ${statusColor}`}
      >
        {!done && !failed && (
          <span className="inline-block mr-2 align-middle ink-dot" />
        )}
        {status}
      </span>
    </div>
  );
}

function TableOfContents({ headings }: { headings: Heading[] }) {
  return (
    <details
      className="border border-[var(--rule)] bg-[color-mix(in_oklch,var(--accent)_4%,transparent)] px-5 py-4 group"
      open
    >
      <summary className="cursor-pointer select-none flex items-baseline justify-between gap-4">
        <span className="eyebrow eyebrow-accent">Contents</span>
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          {headings.length} sections
        </span>
      </summary>
      <ol className="mt-4 flex flex-col gap-1.5">
        {headings.map((h, i) => (
          <li
            key={`${h.id}-${i}`}
            className={`flex items-baseline gap-3 ${h.level === 3 ? "ml-6" : ""}`}
          >
            <span className="font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <a
              href={`#${h.id}`}
              className={`text-foreground/80 transition-colors hover:text-[var(--accent)] ${
                h.level === 3
                  ? "font-body text-sm italic"
                  : "font-body text-[0.95rem]"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

function Sources({
  sources,
  meta,
}: {
  sources: ParsedSource[];
  meta: Map<string, SourceMeta>;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          className="font-display text-2xl text-foreground"
          style={{ fontVariationSettings: '"opsz" 32, "SOFT" 30, "WONK" 0', fontWeight: 500 }}
        >
          Sources
        </h2>
        <span className="eyebrow">
          {sources.length} {sources.length === 1 ? "reference" : "references"}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
        {sources.map((s) => (
          <SourceEntry key={s.index} source={s} meta={meta.get(s.url)} />
        ))}
      </ul>
    </section>
  );
}

function SourceEntry({
  source,
  meta,
}: {
  source: ParsedSource;
  meta: SourceMeta | undefined;
}) {
  const domain = safeDomain(source.url);
  const snippet = meta?.text ? cleanSnippet(meta.text) : null;

  return (
    <li
      id={`source-${source.index}`}
      className="group scroll-mt-24 border-t border-[var(--rule)] last:border-b-0"
    >
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-5 py-5 transition-colors hover:bg-[color-mix(in_oklch,var(--accent)_5%,transparent)]"
      >
        <span className="numeral text-5xl shrink-0 w-12 text-right tabular-nums">
          {source.index}
        </span>
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="font-body text-[1.02rem] leading-snug text-foreground transition-colors group-hover:text-[var(--accent)]">
            {source.title}
          </div>
          {domain && (
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              {domain}
            </div>
          )}
          {snippet && (
            <p className="font-body text-[0.88rem] italic leading-relaxed text-muted-foreground line-clamp-3">
              {snippet}
            </p>
          )}
        </div>
      </a>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Parsers (unchanged contracts — keep the system-prompt format!)      */
/* ------------------------------------------------------------------ */

function splitBodyAndSources(text: string): {
  body: string;
  sources: ParsedSource[];
} {
  const headingRe = /\n##\s+Sources\s*\n/i;
  const match = text.match(headingRe);
  if (!match || match.index === undefined) {
    return { body: text, sources: [] };
  }
  const body = text.slice(0, match.index).trimEnd();
  const sourcesBlock = text.slice(match.index + match[0].length);

  const sources: ParsedSource[] = [];
  const lineRe = /^\s*(\d+)\.\s*\[([^\]]+)\]\(([^)\s]+)\)/gm;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(sourcesBlock)) !== null) {
    sources.push({
      index: Number(m[1]),
      title: m[2].trim(),
      url: m[3].trim(),
    });
  }
  return { body, sources };
}

function linkifyCitations(
  body: string,
  metaByIndex: Map<number, SourceMeta | undefined>,
): string {
  if (metaByIndex.size === 0) return body;

  const segments: { start: number; end: number }[] = [];
  const fenceRe = /```[\s\S]*?```|`[^`\n]*`/g;
  let f: RegExpExecArray | null;
  while ((f = fenceRe.exec(body)) !== null) {
    segments.push({ start: f.index, end: f.index + f[0].length });
  }
  const inSkipZone = (i: number) =>
    segments.some((s) => i >= s.start && i < s.end);

  const citationRe = /\[(\d+)\]/g;
  let result = "";
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = citationRe.exec(body)) !== null) {
    if (inSkipZone(m.index)) continue;
    const n = Number(m[1]);
    if (!metaByIndex.has(n)) continue;
    const before = body.slice(m.index - 1, m.index);
    if (before === "[" || before === "\\") continue;
    result += body.slice(lastEnd, m.index);
    const meta = metaByIndex.get(n);
    const title = meta?.text
      ? snippetForTitle(meta.text)
      : meta?.title
        ? snippetForTitle(meta.title)
        : "";
    // Editorial footnote: just the numeral (no brackets), styled via CSS as superscript serif
    result += title
      ? `[${n}](#source-${n} "${title}")`
      : `[${n}](#source-${n})`;
    lastEnd = m.index + m[0].length;
  }
  result += body.slice(lastEnd);
  return result;
}

function snippetForTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  const truncated =
    trimmed.length > 200 ? trimmed.slice(0, 200) + "..." : trimmed;
  return truncated.replace(/["\\]/g, " ");
}

function parseHeadings(body: string): Heading[] {
  const lines = body.split("\n");
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!m) continue;
    const level = m[1].length === 2 ? 2 : 3;
    const text = m[2].replace(/\s+#+\s*$/, "").trim();
    if (!text || /^sources$/i.test(text)) continue;
    headings.push({ level, text, id: slugify(text) });
  }
  return headings;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractText(children: ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (typeof children === "object" && "props" in children) {
    const props = (children as { props?: { children?: ReactNode } }).props;
    return extractText(props?.children);
  }
  return "";
}

function subscribeTheme(cb: () => void): () => void {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getThemeSnapshot(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getThemeServerSnapshot(): "light" | "dark" {
  return "light";
}

function useTheme(): "light" | "dark" {
  return useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
}

function safeDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function cleanSnippet(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > 220 ? trimmed.slice(0, 220) + "..." : trimmed;
}
