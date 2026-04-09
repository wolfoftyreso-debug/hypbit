// ops-diagnostic — one-shot script the on-call runs against a live
// connector instance to get a quick state dump. Prints canary,
// engine, feature flags, queue depth, and the current metric set.
//
// Usage:
//   node dist/scripts/ops-diagnostic.js [url]
//
// Defaults to http://localhost:3000 so it works from inside the
// container. Pass an ALB DNS name to poll prod from the bastion.

const DEFAULT_URL = 'http://localhost:3000';

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text };
  }
}

async function main(): Promise<void> {
  const base = process.argv[2] ?? DEFAULT_URL;
  const token = process.env.ADMIN_TOKEN;
  const headers = token ? { 'X-Admin-Token': token } : undefined;

  const endpoints = [
    '/health',
    '/ready',
    '/',
    '/v1/engines',
    '/v1/flags',
    '/v1/queue',
    '/metrics',
  ];

  process.stdout.write(`# quixzoom-connector ops diagnostic — ${base}\n\n`);
  process.stdout.write(`Timestamp: ${new Date().toISOString()}\n\n`);

  for (const path of endpoints) {
    process.stdout.write(`## ${path}\n\n`);
    try {
      const res = await fetch(`${base}${path}`, { headers });
      const text = await res.text();
      process.stdout.write('```\n');
      process.stdout.write(`HTTP ${res.status}\n`);
      if (path === '/metrics') {
        const first = text.split('\n').slice(0, 40).join('\n');
        process.stdout.write(first + '\n');
        process.stdout.write(`... (${text.length} bytes total)\n`);
      } else {
        try {
          process.stdout.write(JSON.stringify(JSON.parse(text), null, 2) + '\n');
        } catch {
          process.stdout.write(text.slice(0, 2048) + '\n');
        }
      }
      process.stdout.write('```\n\n');
    } catch (err) {
      process.stdout.write(
        `ERROR: ${err instanceof Error ? err.message : String(err)}\n\n`,
      );
    }
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
