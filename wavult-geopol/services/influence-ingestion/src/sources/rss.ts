import Parser from "rss-parser";
import { ulid } from "ulid";
import type { SourceEventRaw } from "../shared/schemas.js";

const parser = new Parser({ timeout: 15000 });

export async function fetchRss(feedUrl: string): Promise<SourceEventRaw[]> {
  const feed = await parser.parseURL(feedUrl);
  const sourceTag = `rss:${new URL(feedUrl).hostname}`;

  return (feed.items ?? []).map((item) => {
    const published = item.isoDate
      ? Date.parse(item.isoDate)
      : item.pubDate
      ? Date.parse(item.pubDate)
      : Date.now();
    return {
      id: ulid(),
      ts: Date.now(),
      source: sourceTag,
      kind: "NEWS" as const,
      url: item.link,
      title: item.title ?? "(untitled)",
      body: item.contentSnippet ?? item.content ?? "",
      published_at: Number.isFinite(published) ? published : Date.now(),
      raw: { feed: feed.title, categories: item.categories },
    };
  });
}
