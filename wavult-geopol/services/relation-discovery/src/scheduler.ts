import { config } from "./config.js";
import { topTargets } from "./candidates.js";
import { enqueue } from "./queue.js";

let timer: NodeJS.Timeout | null = null;

async function tick(): Promise<void> {
  try {
    const ids = await topTargets(config.DISCOVERY_TOP_N);
    console.log(`[relation-discovery] scheduled pass — ${ids.length} targets queued`);
    for (const id of ids) enqueue(id);
  } catch (err) {
    console.warn("[relation-discovery] scheduled tick failed:", (err as Error).message);
  }
}

export function startScheduler(): void {
  // Run once shortly after boot, then on the interval.
  setTimeout(() => void tick(), 10_000);
  timer = setInterval(() => void tick(), config.DISCOVERY_SCHEDULE_MS);
}

export function stopScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
