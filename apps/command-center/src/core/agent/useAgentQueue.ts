// ─── useAgentQueue hook ──────────────────────────────────────────────────────
// Returns top-N prioritized tasks + system message

import { useMemo } from 'react'
import type { Task } from '../state/stateEngine'
import { buildAgentQueue, buildSystemMessage, type PrioritizedTask } from './priorityEngine'
import type { AgentMessage } from '../../shared/i18n/agentTypes'

export function useAgentQueue(
  tasks: Task[],
  limit = 5
): {
  queue: PrioritizedTask[]
  systemMessage: AgentMessage
  hasCritical: boolean
  topMessage: AgentMessage | null
} {
  return useMemo(() => {
    const queue = buildAgentQueue(tasks, limit)
    const systemMessage = buildSystemMessage(tasks)
    const hasCritical = queue.some(pt => pt.severity === 'critical')
    const topMessage = queue[0]?.agentMessage ?? null

    return { queue, systemMessage, hasCritical, topMessage }
  }, [tasks, limit])
}
