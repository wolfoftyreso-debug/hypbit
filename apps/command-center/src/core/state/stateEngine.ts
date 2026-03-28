// ─── BOS State Engine — Behavioral Operating System ─────────────────────────
// Every UI decision is driven by state. No button exists without validation.

export type TaskState =
  | 'BLOCKED'     // dependency not done
  | 'REQUIRED'    // must be done, no blockers
  | 'IN_PROGRESS' // started
  | 'REVIEW'      // waiting for approval
  | 'DONE'        // complete
  | 'FAILED'      // failed / overdue

export type Priority = 'critical' | 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  description: string
  owner: string             // personId
  module: string            // 'legal' | 'finance' | 'operations' | 'hr' | 'tech'
  flow: string              // which flow this task belongs to
  state: TaskState
  priority: Priority
  deadline: string | null   // ISO date
  dependencies: string[]    // task IDs that must be DONE first
  requiredInputs: string[]  // what is needed to start
  outputValidation: string  // what is validated at completion
  assignedAt: string
  completedAt: string | null
  blockedReason?: string    // why it is BLOCKED
  escalatedAt?: string      // if deadline has passed
}

export interface Flow {
  id: string
  title: string
  module: string
  description: string
  tasks: string[]           // task IDs in order
  state: 'not_started' | 'in_progress' | 'completed' | 'blocked'
}

// Resolve the effective state of a task based on its dependencies
export function resolveTaskState(task: Task, allTasks: Task[]): TaskState {
  const deps = task.dependencies.map(id => allTasks.find(t => t.id === id))
  const allDepsDone = deps.every(d => d?.state === 'DONE')

  if (!allDepsDone) return 'BLOCKED'
  if (task.state === 'DONE' || task.state === 'REVIEW') return task.state

  if (task.deadline) {
    const overdue = new Date(task.deadline) < new Date()
    if (overdue) return 'FAILED'
  }

  return task.state
}

// Compute the next actions for a person — max 5, sorted by priority
export function getNextActionsForPerson(personId: string, tasks: Task[]): Task[] {
  return tasks
    .filter(t => t.owner === personId && (t.state === 'REQUIRED' || t.state === 'IN_PROGRESS'))
    .filter(t => resolveTaskState(t, tasks) !== 'BLOCKED')
    .sort((a, b) => {
      const order: Priority[] = ['critical', 'high', 'medium', 'low']
      return order.indexOf(a.priority) - order.indexOf(b.priority)
    })
    .slice(0, 5)
}

// System-wide traffic light status
export function getSystemStatus(tasks: Task[]): 'red' | 'yellow' | 'green' {
  const critical = tasks.some(t => t.priority === 'critical' && t.state !== 'DONE')
  const failed = tasks.some(t => t.state === 'FAILED')
  if (critical || failed) return 'red'
  const required = tasks.some(t => t.state === 'REQUIRED' && t.priority === 'high')
  if (required) return 'yellow'
  return 'green'
}

// Tasks that are blocking other tasks owned by other people
export function getBlockingTasksForPerson(personId: string, tasks: Task[]): Task[] {
  const personTaskIds = new Set(
    tasks.filter(t => t.owner === personId).map(t => t.id)
  )
  const blockedByPerson = tasks.filter(t =>
    t.owner !== personId &&
    t.dependencies.some(dep => personTaskIds.has(dep))
  )
  return blockedByPerson
}
