// ─── Agent Ruleset — deterministic mapping ───────────────────────────────────
// No manual key assignment. Rules drive everything.

import type { Task } from '../state/stateEngine'
import { resolveTaskState } from '../state/stateEngine'

export type AgentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface AgentRule {
  condition: (ctx: TaskContext) => boolean
  key: string
  severity: AgentSeverity
  score: number
}

export interface TaskContext {
  state: string
  hasDependencies: boolean
  validationRequired: boolean
  deadlineOverdue: boolean
  deadlineHoursLeft: number | null
  priority: string
  blocksCount: number
}

export function buildContext(task: Task, allTasks: Task[]): TaskContext {
  const resolved = resolveTaskState(task, allTasks)
  const now = Date.now()
  const deadline = task.deadline ? new Date(task.deadline).getTime() : null
  const hoursLeft = deadline ? (deadline - now) / 3600000 : null

  return {
    state: resolved,
    hasDependencies: task.dependencies.length > 0,
    validationRequired: task.validationRequired ?? false,
    deadlineOverdue: deadline ? deadline < now : false,
    deadlineHoursLeft: hoursLeft,
    priority: task.priority,
    blocksCount: 0, // beräknas i priorityEngine
  }
}

export const RULESET: AgentRule[] = [
  // CRITICAL — system failure risk
  {
    condition: ctx => ctx.deadlineOverdue && ctx.state !== 'DONE',
    key: 'agent.deadline.overdue',
    severity: 'critical',
    score: 100,
  },
  {
    condition: ctx => ctx.state === 'FAILED',
    key: 'agent.error.generic',
    severity: 'critical',
    score: 95,
  },
  {
    condition: ctx => ctx.state === 'BLOCKED' && ctx.hasDependencies,
    key: 'agent.enforce.missing_dependency',
    severity: 'high',
    score: 90,
  },
  {
    condition: ctx => ctx.state === 'BLOCKED' && ctx.validationRequired,
    key: 'agent.validation.required',
    severity: 'high',
    score: 85,
  },
  // HIGH — needs action today
  {
    condition: ctx =>
      ctx.deadlineHoursLeft !== null &&
      ctx.deadlineHoursLeft > 0 &&
      ctx.deadlineHoursLeft < 24 &&
      ctx.state !== 'DONE',
    key: 'agent.deadline.today',
    severity: 'high',
    score: 80,
  },
  {
    condition: ctx => ctx.state === 'REQUIRED' && ctx.priority === 'critical',
    key: 'agent.task.required',
    severity: 'high',
    score: 75,
  },
  // MEDIUM — in progress or pending
  {
    condition: ctx => ctx.state === 'REQUIRED' && ctx.priority === 'high',
    key: 'agent.task.start',
    severity: 'medium',
    score: 60,
  },
  {
    condition: ctx => ctx.state === 'IN_PROGRESS',
    key: 'agent.task.continue',
    severity: 'medium',
    score: 50,
  },
  {
    condition: ctx => ctx.state === 'REQUIRED',
    key: 'agent.task.start',
    severity: 'medium',
    score: 40,
  },
  {
    condition: ctx => ctx.state === 'REVIEW',
    key: 'agent.command.review_now',
    severity: 'low',
    score: 30,
  },
  // INFO — done or low priority
  {
    condition: ctx => ctx.state === 'DONE',
    key: 'agent.task.completed',
    severity: 'info',
    score: 10,
  }]

export interface MappedTask {
  key: string
  severity: AgentSeverity
  baseScore: number
}

export function mapTaskToAgent(task: Task, allTasks: Task[]): MappedTask {
  const ctx = buildContext(task, allTasks)

  const matched = RULESET
    .filter(rule => rule.condition(ctx))
    .sort((a, b) => b.score - a.score)

  const best = matched[0]

  if (!best) {
    return { key: 'agent.system.ok', severity: 'info', baseScore: 0 }
  }

  return { key: best.key, severity: best.severity, baseScore: best.score }
}
