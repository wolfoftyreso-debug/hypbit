import type { Task } from './stateEngine'

export interface EscalationEvent {
  taskId: string
  taskTitle: string
  owner: string
  deadlinePassedDays: number
  escalatedTo: string[]  // person IDs att notifiera
}

export function checkEscalations(tasks: Task[]): EscalationEvent[] {
  const now = new Date()
  const escalations: EscalationEvent[] = []

  tasks.forEach(task => {
    if (!task.deadline) return
    if (task.state === 'DONE') return

    const deadline = new Date(task.deadline)
    const daysPassed = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))

    if (daysPassed > 0) {
      escalations.push({
        taskId: task.id,
        taskTitle: task.title,
        owner: task.owner,
        deadlinePassedDays: daysPassed,
        escalatedTo: [task.owner, 'erik-svensson'],  // alltid eskalera till Erik
      })
    }
  })

  return escalations.sort((a, b) => b.deadlinePassedDays - a.deadlinePassedDays)
}

// Visa eskalerings-banner om det finns overdue tasks
export function hasEscalations(tasks: Task[]): boolean {
  return checkEscalations(tasks).length > 0
}
