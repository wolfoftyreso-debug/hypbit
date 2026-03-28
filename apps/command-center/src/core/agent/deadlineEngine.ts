import type { Task } from '../state/stateEngine'
import { resolveTaskState } from '../state/stateEngine'
import { eventBus } from './eventBus'

let deadlineTimer: ReturnType<typeof setInterval> | null = null

export function startDeadlineEngine(getTasks: () => Task[]): () => void {
  if (deadlineTimer) clearInterval(deadlineTimer)

  const check = () => {
    const tasks = getTasks()

    tasks.forEach(task => {
      if (!task.deadline || task.state === 'DONE') return

      const resolved = resolveTaskState(task, tasks)
      if (resolved === 'FAILED') {
        // Publish deadline passed event
        eventBus.publish({
          type: 'DEADLINE_PASSED',
          taskId: task.id,
          ownerId: task.owner,
        })
      }
    })
  }

  // Check immediately then every 60 seconds
  check()
  deadlineTimer = setInterval(check, 60000)

  // Return cleanup function
  return () => {
    if (deadlineTimer) clearInterval(deadlineTimer)
    deadlineTimer = null
  }
}
