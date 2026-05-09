import { tool } from "ai";
import { z } from "zod";
import { exa } from "./exa";

export const tools = {
  web_search: tool({
    description:
      "Search the web for information about a topic. Returns a list of relevant pages with titles, URLs, and short text excerpts. Use this to find candidate sources; if a result looks promising, follow up with `read_url` for the full text.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("The search query. Be specific and use keywords likely to appear on relevant pages."),
      num_results: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("How many results to return. Default 5."),
    }),
    execute: async ({ query, num_results }) => {
      const response = await exa.searchAndContents(query, {
        numResults: num_results ?? 5,
        text: { maxCharacters: 1500 },
      });
      return {
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          publishedDate: r.publishedDate ?? null,
          text: r.text,
        })),
      };
    },
  }),

  read_url: tool({
    description:
      "Fetch the full text contents of a specific URL. Use this when a `web_search` result looks worth reading in depth (e.g. a documentation page, article, or pricing table).",
    inputSchema: z.object({
      url: z.string().url().describe("The URL to fetch."),
    }),
    execute: async ({ url }) => {
      const response = await exa.getContents([url], {
        text: { maxCharacters: 8000 },
      });
      const result = response.results[0];
      if (!result) {
        return { error: `No content found for ${url}` };
      }
      return {
        title: result.title,
        url: result.url,
        publishedDate: result.publishedDate ?? null,
        text: result.text,
      };
    },
  }),
};
