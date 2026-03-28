export type BOSEvent =
  | { type: 'TASK_UPDATED'; taskId: string }
  | { type: 'TASK_COMPLETED'; taskId: string; ownerId: string }
  | { type: 'TASK_CREATED'; taskId: string }
  | { type: 'TASK_BLOCKED'; taskId: string; blockedBy: string }
  | { type: 'FLOW_UPDATED'; flowId: string }
  | { type: 'DEADLINE_PASSED'; taskId: string; ownerId: string }
  | { type: 'ESCALATION'; taskId: string; ownerId: string; escalatedTo: string }

type EventListener = (event: BOSEvent) => void

class EventBus {
  private listeners = new Set<EventListener>()

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)  // unsubscribe fn
  }

  publish(event: BOSEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (err) {
        console.error('[EventBus] Listener error:', err)
      }
    })
  }
}

// Singleton
export const eventBus = new EventBus()
