# @quixzoom/connector-client

Official TypeScript client for the quiXzoom AI Connector. Zero
runtime dependencies. Works in Node 20+ and modern browsers.

## Install

```bash
npm install @quixzoom/connector-client
```

## Quick start

```typescript
import { QuixzoomClient } from '@quixzoom/connector-client';

const client = new QuixzoomClient({
  baseUrl: 'https://mcp.quixzoom.com',
  apiKey: process.env.QUIXZOOM_API_KEY!,
});

// One-shot query
const result = await client.query('Show me Stureplan right now');
console.log(result.task_id, result.price?.total, 'SEK');

// Stream progress until COMPLETE or ERROR
for await (const event of client.stream(result.task_id!)) {
  switch (event.event) {
    case 'ACK':
      console.log('connected');
      break;
    case 'STATUS':
      console.log('status:', event.data);
      break;
    case 'IMAGE_ADDED':
      console.log('new image:', event.data.url);
      break;
    case 'COMPLETE':
      console.log('done');
      break;
  }
}
```

## Features

- Full type safety for requests and responses
- Automatic `Idempotency-Key` generation (override per call)
- Optional HMAC signing via `hmacSecret`
- Optional JWT bearer token for per-user quotas
- Automatic W3C `traceparent` propagation
- SSE reader with automatic reconnect using `Last-Event-ID`
- Timeout + AbortController per request

## Options

```typescript
interface ClientOptions {
  baseUrl: string;               // e.g. https://mcp.quixzoom.com
  apiKey?: string;               // sent as X-API-Key
  hmacSecret?: string;           // if set, signs every POST body
  idempotencyKey?: () => string; // default: fresh UUID per call
  timeoutMs?: number;            // default: 10000
  bearerToken?: string;          // Authorization: Bearer ...
  traceparent?: () => string;    // W3C traceparent supplier
}
```

## Error handling

All failures throw `QuixzoomError` with `.status` and `.body`:

```typescript
try {
  await client.query('Visa Stockholm nu');
} catch (err) {
  if (err instanceof QuixzoomError && err.status === 429) {
    console.log('rate limited, retry after:',
      err.body?.window_seconds);
  }
}
```
