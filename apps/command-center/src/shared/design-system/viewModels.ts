import type { Task, TaskState } from '../../core/state/stateEngine'
import { resolveTaskState } from '../../core/state/stateEngine'

export function resolvePrimaryAction(state: TaskState): string | null {
  switch (state) {
    case 'REQUIRED':    return 'task.start'
    case 'IN_PROGRESS': return 'task.continue'
    case 'REVIEW':      return 'task.complete'
    case 'FAILED':      return 'agent.command.fix_issue'
    case 'BLOCKED':     return null
    case 'DONE':        return null
    default:            return null
  }
}

export type StatusTier = 'critical' | 'high' | 'medium' | 'low' | 'done' | 'blocked'

export function resolveStatusTier(task: Task & { state: TaskState }): StatusTier {
  if (task.state === 'DONE') return 'done'
  if (task.state === 'BLOCKED') return 'blocked'
  if (task.state === 'FAILED') return 'critical'
  if (task.priority === 'critical') return 'critical'
  if (task.priority === 'high') return 'high'
  if (task.priority === 'medium') return 'medium'
  return 'low'
}

export const STATUS_COLORS = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500', bar: '#DC2626' },
  high:     { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', bar: '#D97706' },
  medium:   { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400', bar: '#2563EB' },
  low:      { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', dot: 'bg-gray-300', bar: '#9CA3AF' },
  done:     { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', bar: '#059669' },
  blocked:  { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-400', dot: 'bg-gray-300', bar: '#9CA3AF' },
} as const

export interface TaskViewModel {
  id: string
  title: string
  description: string
  owner: string
  deadline: string | null
  resolvedState: TaskState
  statusTier: StatusTier
  primaryAction: string | null
  isBlocked: boolean
  isDone: boolean
  blockedReason?: string
  colors: typeof STATUS_COLORS[StatusTier]
  isOverdue: boolean
}

export function buildTaskViewModel(task: Task, allTasks: Task[]): TaskViewModel {
  const resolvedState = resolveTaskState(task, allTasks)
  const statusTier = resolveStatusTier({ ...task, state: resolvedState })
  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() && resolvedState !== 'DONE' : false
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    owner: task.owner,
    deadline: task.deadline,
    resolvedState,
    statusTier,
    primaryAction: resolvePrimaryAction(resolvedState),
    isBlocked: resolvedState === 'BLOCKED',
    isDone: resolvedState === 'DONE',
    blockedReason: task.blockedReason,
    colors: STATUS_COLORS[statusTier],
    isOverdue,
  }
}

export interface SystemViewModel {
  status: 'red' | 'yellow' | 'green'
  criticalCount: number
  blockerCount: number
  modules: Array<{ id: string; label: string; statusTier: StatusTier; openCount: number }>
}

export function buildSystemViewModel(tasks: Task[]): SystemViewModel {
  const critical = tasks.filter(t => t.priority === 'critical' && t.state !== 'DONE')
  const blocked = tasks.filter(t => t.state === 'BLOCKED')
  const status = critical.length > 0 ? 'red' as const : blocked.length > 0 ? 'yellow' as const : 'green' as const
  const moduleIds = ['legal', 'finance', 'operations', 'tech', 'hr']
  const moduleLabels: Record<string, string> = { legal: 'Legal', finance: 'Finance', operations: 'Operations', tech: 'Tech', hr: 'HR' }
  const modules = moduleIds.map(id => {
    const modTasks = tasks.filter(t => t.module === id)
    const open = modTasks.filter(t => t.state !== 'DONE')
    const hasCritical = open.some(t => t.priority === 'critical')
    const hasHigh = open.some(t => t.priority === 'high')
    const statusTier: StatusTier = hasCritical ? 'critical' : hasHigh ? 'high' : open.length > 0 ? 'medium' : 'done'
    return { id, label: moduleLabels[id], statusTier, openCount: open.length }
  })
  return { status, criticalCount: critical.length, blockerCount: blocked.length, modules }
}
