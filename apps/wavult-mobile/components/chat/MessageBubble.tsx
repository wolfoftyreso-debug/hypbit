import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../constants/theme'
import { ContainerCard } from '../feed/ContainerCard'
import { BerntAvatar } from './BerntAvatar'
import type { ChatMessage } from '../../lib/store'

type Props = { message: ChatMessage }

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && <BerntAvatar />}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
          {message.content}
        </Text>
        {message.containers && message.containers.length > 0 && (
          <View style={styles.containers}>
            {message.containers.map((c) => (
              <ContainerCard key={c.id} container={c} compact />
            ))}
          </View>
        )}
        <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAssistant]}>
          {new Date(message.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: 4,
  },
  bubbleUser: {
    backgroundColor: theme.colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: '#fff',
  },
  textAssistant: {
    color: theme.colors.text,
  },
  containers: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
    marginHorizontal: -theme.spacing.md,
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  timestampUser: {
    color: 'rgba(255,255,255,0.4)',
  },
  timestampAssistant: {
    color: theme.colors.textMuted,
  },
})
