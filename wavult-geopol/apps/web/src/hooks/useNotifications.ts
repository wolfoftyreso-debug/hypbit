import { useEffect, useRef, useState } from "react";
import type { Notification } from "../types";

/**
 * Subscribes to /api/notifications/stream via SSE and keeps a
 * ring-buffered list of the most recent notifications. Falls back
 * to polling /api/notifications if EventSource fails.
 */
export function useNotifications(limit = 50): Notification[] {
  const [items, setItems] = useState<Notification[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");
    esRef.current = es;

    es.onmessage = (evt) => {
      try {
        const n = JSON.parse(evt.data) as Notification;
        setItems((prev) => {
          if (prev.some((p) => p.id === n.id)) return prev;
          return [n, ...prev].slice(0, limit);
        });
      } catch {
        /* ignore */
      }
    };

    es.onerror = () => {
      es.close();
      // Polling fallback
      fetch("/api/notifications?limit=" + limit)
        .then((r) => r.json())
        .then(setItems)
        .catch(() => {});
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [limit]);

  return items;
}
