import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../../constants/theme'
import { PriorityBadge } from './PriorityBadge'
import type { Container } from '../../lib/mockData'

type Props = {
  container: Container
  onExecute?: () => void
  onDelegate?: () => void
  onPress?: () => void
  onExecuteViaBernt?: () => void
  compact?: boolean
  completed?: boolean
}

const CONTEXT_ICONS: Record<string, string> = {
  Legal: '⚖️',
  Finance: '💰',
  Sales: '📈',
  Operations: '⚙️',
  HR: '👥',
  Bolagsstruktur: '🏢',
  Ekonomi: '💰',
  Sälj: '📈',
  Thailand: '🇹🇭',
  Teknik: '💻',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

export function ContainerCard({ container, onExecute, onDelegate, onPress, onExecuteViaBernt, compact, completed }: Props) {
  const icon = CONTEXT_ICONS[container.context] || '📋'
  const priorityColor =
    container.priorityScore >= 90
      ? theme.colors.error
      : container.priorityScore >= 75
      ? theme.colors.warning
      : theme.colors.success

  return (
    <TouchableOpacity
      style={[styles.card, completed && styles.cardCompleted]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {completed && (
        <View style={styles.completedOverlay}>
          <Text style={styles.completedIcon}>✓</Text>
        </View>
      )}
      <View style={styles.header}>
        <PriorityBadge score={container.priorityScore} />
        <Text style={styles.context}>{icon} {container.context}</Text>
      </View>
      <Text style={[styles.title, completed && styles.titleCompleted]} numberOfLines={compact ? 2 : undefined}>
        {container.title}
      </Text>
      <Text style={styles.time}>
        {formatTime(container.timeStart)} – {formatTime(container.timeEnd)}
      </Text>
      {container.assignee && (
        <Text style={styles.assignee}>→ {container.assignee}</Text>
      )}
      {container.department && !compact && (
        <View style={[styles.departmentTag, { borderColor: priorityColor + '44' }]}>
          <Text style={[styles.departmentText, { color: priorityColor }]}>{container.department}</Text>
        </View>
      )}
      {!compact && (
        <View style={styles.actions}>
          {onExecuteViaBernt && (
            <TouchableOpacity style={styles.berntBtn} onPress={onExecuteViaBernt}>
              <Text style={styles.berntBtnText}>🤖 Exekvera via Bernt</Text>
            </TouchableOpacity>
          )}
          {onExecute && (
            <TouchableOpacity style={styles.actionBtn} onPress={onExecute}>
              <Text style={styles.actionBtnText}>Execute</Text>
            </TouchableOpacity>
          )}
          {onDelegate && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={onDelegate}>
              <Text style={styles.actionBtnTextSecondary}>Delegate</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    gap: 6,
    overflow: 'hidden',
  },
  cardCompleted: {
    opacity: 0.5,
    borderColor: theme.colors.success + '44',
  },
  completedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  completedIcon: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  context: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  time: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  assignee: {
    color: theme.colors.accentLight,
    fontSize: 12,
  },
  departmentTag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  departmentText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  berntBtn: {
    backgroundColor: 'rgba(109, 58, 238, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(109, 58, 238, 0.4)',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  berntBtnText: {
    color: theme.colors.accentLight,
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnTextSecondary: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
})
