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
  validationRequired: boolean                                   // default false
  validationType?: 'TEXT' | 'FILE' | 'SIGNATURE' | 'CONFIRMATION'
  validationValue?: string | null                               // vad som loggades vid validering
}

export interface ValidationInput {
  text?: string
  file?: File | null
  signed?: boolean
  confirmed?: boolean
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

// resolveFlowState — beräknar flow-state dynamiskt från tasks
export function resolveFlowState(flowTasks: Task[]): 'not_started' | 'in_progress' | 'completed' | 'blocked' {
  if (flowTasks.length === 0) return 'not_started'
  if (flowTasks.every(t => t.state === 'DONE')) return 'completed'
  if (flowTasks.some(t => resolveTaskState(t, flowTasks) === 'BLOCKED')) return 'blocked'
  return 'in_progress'
}

// validateTaskInput — validerar input innan state-förändring tillåts
export function validateTaskInput(task: Task, input: ValidationInput): boolean {
  if (!task.validationRequired) return true
  switch (task.validationType) {
    case 'TEXT': return typeof input.text === 'string' && input.text.trim().length >= 3
    case 'FILE': return input.file != null
    case 'SIGNATURE': return input.signed === true
    case 'CONFIRMATION': return input.confirmed === true
    default: return true
  }
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
