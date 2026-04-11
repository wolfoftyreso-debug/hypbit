import { config } from "./config.js";
import { runAgent } from "./runner.js";

let timer: NodeJS.Timeout | null = null;
let running = false;

export function startScheduler(): void {
  // First run shortly after boot so fresh installs show something quickly.
  setTimeout(async () => {
    if (running) return;
    running = true;
    try {
      await runAgent();
    } catch (err) {
      console.warn("[agent] scheduled run failed:", (err as Error).message);
    } finally {
      running = false;
    }
  }, 30_000);

  timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await runAgent();
    } catch (err) {
      console.warn("[agent] scheduled run failed:", (err as Error).message);
    } finally {
      running = false;
    }
  }, config.AGENT_SCHEDULE_MS);
}

export function stopScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
