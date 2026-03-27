import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { ChatContainer } from '../../components/chat/ChatContainer'
import { InputBar } from '../../components/chat/InputBar'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'
import { MOCK_CONTAINERS, MOCK_AI_RESPONSES } from '../../lib/mockData'
import { theme } from '../../constants/theme'
import type { ChatMessage } from '../../lib/store'
import type { Container } from '../../lib/mockData'

let msgIdCounter = 0
function genId() { return `msg_${Date.now()}_${++msgIdCounter}` }

// Keyword matching → rätt svar
function getResponseKey(input: string): string {
  const lc = input.toLowerCase()
  if (lc.includes('task') || lc.includes('container') || lc.includes('idag') || lc.includes('visa')) {
    return 'tasks'
  }
  if (lc.includes('finans') || lc.includes('ekonomi') || lc.includes('kassa') || lc.includes('lön')) {
    return 'finance'
  }
  if (lc.includes('team') || lc.includes('vem') || lc.includes('status') || lc.includes('personal')) {
    return 'team'
  }
  if (lc.includes('legal') || lc.includes('avtal') || lc.includes('signera') || lc.includes('juridik')) {
    return 'legal'
  }
  if (lc.includes('thailand') || lc.includes('april') || lc.includes('workcamp')) {
    return 'thailand'
  }
  if (lc.includes('pipeline') || lc.includes('deal') || lc.includes('sälj') || lc.includes('salj')) {
    return 'pipeline'
  }
  return 'default'
}

function getMockResponse(input: string): { text: string; containers?: Container[] } {
  const key = getResponseKey(input)
  const text = MOCK_AI_RESPONSES[key] || MOCK_AI_RESPONSES.default
  // Om task/container-svar — bifoga de 3 mest kritiska containers
  if (key === 'tasks') {
    const todayContainers = MOCK_CONTAINERS
      .filter(c => c.timeStart.startsWith('2026-03-27'))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3)
    return { text, containers: todayContainers }
  }
  return { text }
}

// Quick action-knappar
const QUICK_ACTIONS = [
  { label: '📋 Tasks idag', query: 'Visa mina containers idag' },
  { label: '💰 Ekonomi', query: 'Visa finansöversikt' },
  { label: '👥 Team', query: 'Visa teamstatus' },
  { label: '🇹🇭 Thailand', query: 'Thailand workcamp status' },
]

export default function AICommandCenter() {
  const router = useRouter()
  const params = useLocalSearchParams<{ berntQuery?: string }>()
  const {
    user,
    messages,
    addMessage,
    updateMessage,
    isStreaming,
    setIsStreaming,
    containers,
    setContainers,
  } = useStore()
  const [input, setInput] = useState('')
  const [isLive, setIsLive] = useState<boolean | null>(null) // null = checking
  const greetingOpacity = useRef(new Animated.Value(0)).current
  const hasInit = useRef(false)
  const berntQueryHandled = useRef(false)

  // Check if API is live
  useEffect(() => {
    async function checkLiveStatus() {
      try {
        const tasks = await api.get('/api/tasks/active')
        setIsLive(true)
        // If we got real tasks, use them
        if ((tasks as any)?.data?.length > 0) {
          // Live data available
        }
      } catch {
        setIsLive(false)
      }
    }
    checkLiveStatus()
  }, [])

  // Init: ladda containers + visa välkomstmeddelande med fade-in
  useEffect(() => {
    if (hasInit.current) return
    hasInit.current = true

    if (containers.length === 0) {
      setContainers(MOCK_CONTAINERS)
    }

    if (messages.length === 0) {
      // Fördröj lite så att UI hinner rendera
      setTimeout(() => {
        addMessage({
          id: genId(),
          role: 'assistant',
          content: MOCK_AI_RESPONSES.greeting,
          timestamp: Date.now(),
        })
        // Fade in
        Animated.timing(greetingOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start()
      }, 200)
    }
  }, [])

  // Hantera berntQuery param (från feed "Exekvera via Bernt")
  useEffect(() => {
    if (params.berntQuery && !berntQueryHandled.current && !isStreaming) {
      berntQueryHandled.current = true
      setTimeout(() => {
        sendMessage(params.berntQuery as string)
      }, 400)
    }
  }, [params.berntQuery])

  // Streaming-simulering: visa ord för ord med 30ms delay
  async function streamText(msgId: string, fullText: string) {
    const words = fullText.split(' ')
    let current = ''
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? '' : ' ') + words[i]
      updateMessage(msgId, { content: current })
      await new Promise(r => setTimeout(r, 30))
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setInput('')

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    setIsStreaming(true)

    // Initial delay — simulerar att Bernt "tänker"
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400))

    const response = getMockResponse(trimmed)
    const assistantMsgId = genId()

    // Lägg till tomt meddelande och streama in innehållet
    addMessage({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      containers: response.containers,
      timestamp: Date.now(),
    })

    setIsStreaming(false)
    await streamText(assistantMsgId, response.text)
  }

  function handleSend() {
    sendMessage(input)
  }

  function handleQuickAction(query: string) {
    if (isStreaming) return
    sendMessage(query)
  }

  // Live/demo status indicator
  const liveStatusColor = isLive === null ? '#888' : isLive ? theme.colors.success : '#ef4444'
  const liveStatusText =
    isLive === null
      ? 'Ansluter...'
      : isLive
      ? 'Live — Wavult OS ansluten'
      : 'Demo-läge — API ej tillgänglig'

  return (
    <SafeAreaView style={styles.container}>
      {/* Live/Demo status banner */}
      <View style={styles.statusBanner}>
        <View style={[styles.statusDot, { backgroundColor: liveStatusColor }]} />
        <Text style={[styles.statusText, { color: liveStatusColor }]}>{liveStatusText}</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.berntDot} />
          <Text style={styles.headerTitle}>BERNT</Text>
          <Text style={styles.headerSub}>AI-OPERATÖR</Text>
        </View>
        <View style={styles.headerRight}>
          {user && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.initials}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chat */}
      <View style={styles.chatArea}>
        <ChatContainer messages={messages} isStreaming={isStreaming} />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsScroll}
        >
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.quickActionBtn, isStreaming && styles.quickActionDisabled]}
              onPress={() => handleQuickAction(action.query)}
              disabled={isStreaming}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <InputBar
        value={input}
        onChangeText={setInput}
        onSend={handleSend}
        disabled={isStreaming}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  berntDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 3,
  },
  headerSub: {
    color: theme.colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    marginLeft: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  chatArea: {
    flex: 1,
  },
  quickActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  quickActionsScroll: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    flexDirection: 'row',
  },
  quickActionBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickActionDisabled: {
    opacity: 0.4,
  },
  quickActionText: {
    color: theme.colors.accentLight,
    fontSize: 13,
    fontWeight: '500',
  },
})
