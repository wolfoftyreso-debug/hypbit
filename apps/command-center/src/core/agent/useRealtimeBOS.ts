import { useEffect, useCallback, useRef } from 'react'
import { eventBus, type BOSEvent } from './eventBus'
import { startDeadlineEngine } from './deadlineEngine'
import type { Task } from '../state/stateEngine'

export interface RealtimeBOSCallbacks {
  onTaskCompleted?: (taskId: string, ownerId: string) => void
  onDeadlinePassed?: (taskId: string, ownerId: string) => void
  onEscalation?: (taskId: string, escalatedTo: string) => void
}

export function useRealtimeBOS(tasks: Task[], callbacks?: RealtimeBOSCallbacks) {
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks

  // Handle escalation — tasks overdue → publish escalation event
  const handleEscalation = useCallback((taskId: string, ownerId: string) => {
    // Always escalate to Erik
    eventBus.publish({
      type: 'ESCALATION',
      taskId,
      ownerId,
      escalatedTo: 'erik-svensson',
    })
    callbacks?.onDeadlinePassed?.(taskId, ownerId)
  }, [callbacks])

  useEffect(() => {
    // Subscribe to events
    const unsubscribe = eventBus.subscribe((event: BOSEvent) => {
      switch (event.type) {
        case 'TASK_COMPLETED':
          callbacks?.onTaskCompleted?.(event.taskId, event.ownerId)
          break
        case 'DEADLINE_PASSED':
          handleEscalation(event.taskId, event.ownerId)
          break
        case 'ESCALATION':
          callbacks?.onEscalation?.(event.taskId, event.escalatedTo)
          break
      }
    })

    // Start deadline engine
    const stopDeadlineEngine = startDeadlineEngine(() => tasksRef.current)

    return () => {
      unsubscribe()
      stopDeadlineEngine()
    }
  }, [handleEscalation, callbacks])
}
