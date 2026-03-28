// ─── Agent Priority Engine ───────────────────────────────────────────────────
// Calculates final score from base rule score + deadline + blocking + priority

import type { Task } from '../state/stateEngine'
import { mapTaskToAgent, type AgentSeverity } from './ruleset'
import type { AgentMessage } from '../../shared/i18n/agentTypes'

export interface PrioritizedTask {
  task: Task
  agentMessage: AgentMessage
  finalScore: number
  severity: AgentSeverity
}

function calculateScore(task: Task, baseScore: number, allTasks: Task[]): number {
  let score = baseScore
  const now = Date.now()

  // Deadline weight
  if (task.deadline) {
    const deadline = new Date(task.deadline).getTime()
    const hoursLeft = (deadline - now) / 3600000

    if (hoursLeft < 0)        score += 50  // overdue
    else if (hoursLeft < 6)   score += 30  // due within 6h
    else if (hoursLeft < 24)  score += 15  // due today
    else if (hoursLeft < 168) score += 5   // due this week
  }

  // Blocking impact — tasks that block others are higher priority
  const blocksOthers = allTasks.filter(t => t.dependencies.includes(task.id))
  score += blocksOthers.length * 10

  // Priority multiplier
  const priorityBonus: Record<string, number> = {
    critical: 40,
    high: 20,
    medium: 5,
    low: 0,
  }
  score += priorityBonus[task.priority] ?? 0

  return score
}

export function prioritizeTasks(tasks: Task[]): PrioritizedTask[] {
  return tasks
    .map(task => {
      const { key, severity, baseScore } = mapTaskToAgent(task, tasks)
      const finalScore = calculateScore(task, baseScore, tasks)

      const agentMessage: AgentMessage = {
        key,
        severity,
        params: {
          title: task.title,
          count: tasks.filter(t => t.dependencies.includes(task.id)).length,
          name: task.owner,
        },
      }

      return { task, agentMessage, finalScore, severity }
    })
    .sort((a, b) => b.finalScore - a.finalScore)
}

// Top N tasks for queue — filters out DONE
export function buildAgentQueue(tasks: Task[], limit = 5): PrioritizedTask[] {
  return prioritizeTasks(tasks)
    .filter(pt => pt.task.state !== 'DONE')
    .slice(0, limit)
}

// System-level message based on global state
export function buildSystemMessage(tasks: Task[]): AgentMessage {
  const critical = tasks.filter(t => t.priority === 'critical' && t.state !== 'DONE')
  const failed = tasks.filter(t => t.state === 'FAILED')
  const blocked = tasks.filter(t => t.state === 'BLOCKED')

  if (failed.length > 0 || critical.length > 0) {
    return {
      key: 'agent.system.blocked',
      severity: 'critical',
      params: { count: critical.length + failed.length },
    }
  }
  if (blocked.length > 0) {
    return {
      key: 'agent.system.risk',
      severity: 'high',
      params: { count: blocked.length },
    }
  }
  return { key: 'agent.system.ok', severity: 'info' }
}
