import { Lock, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react'
import type { TaskViewModel } from './viewModels'
import { useTranslation } from '../i18n/useTranslation'

interface TaskCardProps {
  vm: TaskViewModel
  onAction?: (taskId: string, action: string) => void
  compact?: boolean
}

export function TaskCard({ vm, onAction, compact = false }: TaskCardProps) {
  const { t } = useTranslation()
  const c = vm.colors

  const Icon = vm.isBlocked ? Lock : vm.isDone ? CheckCircle : vm.isOverdue ? AlertTriangle : ArrowRight

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border ${c.border} ${c.bg} ${vm.isBlocked ? 'opacity-60' : ''}`}
      style={{ borderLeftWidth: 4, borderLeftColor: c.bar }}
    >
      <span className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${c.text} truncate`}>{vm.title}</p>
        {!compact && vm.deadline && (
          <p className={`text-xs font-mono mt-0.5 ${vm.isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
            {vm.owner} · {vm.deadline}{vm.isOverdue ? ' — FÖRSENAD' : ''}
          </p>
        )}
        {vm.isBlocked && vm.blockedReason && (
          <p className="text-xs text-gray-400 mt-1 font-mono">{t('task.blocked_by')}: {vm.blockedReason}</p>
        )}
      </div>
      {vm.primaryAction && !vm.isBlocked && onAction ? (
        <button
          onClick={() => onAction(vm.id, vm.primaryAction!)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${c.text} border ${c.border} hover:opacity-80 transition-opacity flex-shrink-0`}
        >
          <Icon className="w-3 h-3" />
          {t(vm.primaryAction)}
        </button>
      ) : vm.isBlocked ? (
        <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
      ) : null}
    </div>
  )
}
