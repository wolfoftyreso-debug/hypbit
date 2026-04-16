import { ulid } from "ulid";
import type { SourceEventRaw } from "../shared/schemas.js";

/**
 * Offline mock source for local dev so the pipeline runs even
 * without network / paid APIs. Emits a handful of plausible items
 * designed to exercise the normalizer, enricher and alert rules.
 */
export function mockSource(): SourceEventRaw[] {
  const now = Date.now();
  return [
    {
      id: ulid(),
      ts: now,
      source: "mock:news",
      kind: "NEWS",
      title: "Amazon names new CEO for AWS EU region",
      body: "Jeff Bezos announces leadership change affecting Amazon Web Services in Europe.",
      url: "https://example.com/amazon-aws-eu-ceo",
      published_at: now,
    },
    {
      id: ulid(),
      ts: now,
      source: "mock:news",
      kind: "NEWS",
      title: "EU regulation on AI infrastructure signed",
      body: "Ursula von der Leyen signs new AI regulation targeting cloud providers.",
      url: "https://example.com/eu-ai-reg",
      published_at: now,
    },
    {
      id: ulid(),
      ts: now,
      source: "mock:news",
      kind: "NEWS",
      title: "OpenAI announces $10B funding round",
      body: "Sam Altman confirms new investment round led by strategic partners.",
      url: "https://example.com/openai-funding",
      published_at: now,
    },
    {
      id: ulid(),
      ts: now,
      source: "mock:events",
      kind: "EVENT_LISTING",
      title: "Web Summit Lisbon — keynote speakers announced",
      body: "Satya Nadella confirmed as headline speaker. Event runs Nov 10-13.",
      url: "https://example.com/web-summit",
      published_at: now,
    },
  ];
}
