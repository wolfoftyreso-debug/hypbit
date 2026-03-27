import { useState, useMemo, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  TextInput,
  RefreshControl,
  Animated,
  PanResponder,
} from 'react-native'
import { useRouter } from 'expo-router'
import { ContainerCard } from '../../components/feed/ContainerCard'
import { DateSectionHeader } from '../../components/feed/DateSectionHeader'
import { useStore } from '../../lib/store'
import { MOCK_CONTAINERS } from '../../lib/mockData'
import { theme } from '../../constants/theme'
import type { Container } from '../../lib/mockData'

function groupByDate(containers: Container[]) {
  const map = new Map<string, Container[]>()
  for (const c of containers) {
    const date = c.timeStart.split('T')[0]
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(c)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      title: formatSectionTitle(date),
      dateKey: date,
      data: [...data].sort((a, b) => b.priorityScore - a.priorityScore),
    }))
}

function formatSectionTitle(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const isToday = d.toDateString() === today.toDateString()
  const isTomorrow = d.toDateString() === tomorrow.toDateString()

  const label = isToday ? 'IDAG' : isTomorrow ? 'IMORGON' : ''
  const formatted = d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
  return label ? `${label}  ${formatted}` : formatted
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function isNowMarker(container: Container): boolean {
  const now = new Date()
  const start = new Date(container.timeStart)
  const end = new Date(container.timeEnd)
  return now >= start && now <= end
}

// Swipeable wrapper — svep åt höger för att markera som klar
function SwipeableRow({
  children,
  onComplete,
}: {
  children: React.ReactNode
  onComplete: () => void
}) {
  const translateX = useRef(new Animated.Value(0)).current
  const hasTriggered = useRef(false)

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(Math.min(gestureState.dx, 100))
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 80 && !hasTriggered.current) {
          hasTriggered.current = true
          // Snapp till höger, sen tillbaka
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: 120,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onComplete()
          })
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
          hasTriggered.current = false
        }
      },
    })
  ).current

  return (
    <View>
      {/* Grön bakgrund visas vid svep */}
      <View style={swipeStyles.swipeBg}>
        <Text style={swipeStyles.swipeIcon}>✓</Text>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  )
}

const swipeStyles = StyleSheet.create({
  swipeBg: {
    position: 'absolute',
    left: 16,
    top: 4,
    bottom: 4,
    width: 80,
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  swipeIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
})

export default function PriorityFeed() {
  const router = useRouter()
  const { containers, setContainers, updateContainer } = useStore()
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  // Init containers om tomma
  const allContainers = containers.length > 0 ? containers : MOCK_CONTAINERS

  const filtered = searchQuery
    ? allContainers.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.context.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allContainers

  const sections = useMemo(() => groupByDate(filtered), [filtered])

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    // Simulera API-anrop
    setTimeout(() => {
      setContainers([...MOCK_CONTAINERS])
      setRefreshing(false)
    }, 1200)
  }, [])

  function handleComplete(id: string) {
    setCompletedIds(prev => new Set([...prev, id]))
    updateContainer(id, { status: 'completed' })
  }

  function handleExecute(id: string) {
    updateContainer(id, { status: 'in_progress' })
    setSelectedContainer(null)
  }

  function handleDelegate(id: string) {
    updateContainer(id, { status: 'delegated' })
    setSelectedContainer(null)
  }

  function handleExecuteViaBernt(container: Container) {
    setSelectedContainer(null)
    // Navigera till AI-chatten med förfyllt meddelande
    // Använder global store för att pre-fylla input — router push till index-tab
    router.push({
      pathname: '/(tabs)',
      params: { berntQuery: `Exekvera container: ${container.title}` },
    })
  }

  // Tidslinjemarkör — röd linje vid "nu"
  const nowHour = new Date().getHours()
  const nowMin = new Date().getMinutes()
  const nowLabel = `${String(nowHour).padStart(2, '0')}:${String(nowMin).padStart(2, '0')}`

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PRIORITY FEED</Text>
        <View style={styles.headerRight}>
          <View style={styles.nowBadge}>
            <View style={styles.nowDot} />
            <Text style={styles.nowText}>{nowLabel}</Text>
          </View>
          <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {searchVisible && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Sök containers..."
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
          />
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <DateSectionHeader title={section.title} />
        )}
        renderItem={({ item }) => {
          const isCompleted = completedIds.has(item.id) || item.status === 'completed'
          const isNow = isNowMarker(item) && section_is_today(item.timeStart)

          return (
            <View>
              {isNow && (
                <View style={styles.nowMarker}>
                  <View style={styles.nowMarkerDot} />
                  <View style={styles.nowMarkerLine} />
                  <Text style={styles.nowMarkerText}>NU</Text>
                </View>
              )}
              <SwipeableRow onComplete={() => handleComplete(item.id)}>
                <ContainerCard
                  container={item}
                  onPress={() => setSelectedContainer(item)}
                  onExecute={() => handleExecute(item.id)}
                  onDelegate={() => handleDelegate(item.id)}
                  onExecuteViaBernt={() => handleExecuteViaBernt(item)}
                  completed={isCompleted}
                />
              </SwipeableRow>
            </View>
          )
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accentLight}
            colors={[theme.colors.accent]}
          />
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selectedContainer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedContainer(null)}
      >
        {selectedContainer && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedContainer.title}</Text>
                <TouchableOpacity onPress={() => setSelectedContainer(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalMeta}>
                <Text style={styles.modalMetaText}>
                  🕐 {formatTime(selectedContainer.timeStart)} – {formatTime(selectedContainer.timeEnd)}
                </Text>
                <Text style={styles.modalMetaText}>
                  🎯 Prioritet: {selectedContainer.priorityScore}
                </Text>
                <Text style={styles.modalMetaText}>
                  📁 Status: {selectedContainer.status}
                </Text>
                <Text style={styles.modalMetaText}>
                  🏢 Avdelning: {selectedContainer.department}
                </Text>
                {selectedContainer.assignee && (
                  <Text style={styles.modalMetaText}>
                    👤 Ansvarig: {selectedContainer.assignee}
                  </Text>
                )}
                {selectedContainer.goal && (
                  <Text style={styles.modalMetaText}>
                    🏁 Mål: {selectedContainer.goal}
                  </Text>
                )}
              </View>

              {selectedContainer.requiredActions && selectedContainer.requiredActions.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>ÅTGÄRDER KRÄVS</Text>
                  {selectedContainer.requiredActions.map((action, i) => (
                    <View key={i} style={styles.actionItem}>
                      <Text style={styles.actionItemNum}>{i + 1}.</Text>
                      <Text style={styles.actionItemText}>{action}</Text>
                    </View>
                  ))}
                </View>
              )}

              {selectedContainer.notes && (
                <View style={styles.modalNotes}>
                  <Text style={styles.modalNotesLabel}>ANTECKNINGAR</Text>
                  <Text style={styles.modalNotesText}>{selectedContainer.notes}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.berntBtn}
                  onPress={() => handleExecuteViaBernt(selectedContainer)}
                >
                  <Text style={styles.berntBtnText}>🤖 Exekvera via Bernt</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.executeBtn}
                  onPress={() => handleExecute(selectedContainer.id)}
                >
                  <Text style={styles.executeBtnText}>Execute</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.delegateBtn}
                  onPress={() => handleDelegate(selectedContainer.id)}
                >
                  <Text style={styles.delegateBtnText}>Delegate</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  )
}

// Hjälpfunktion: kolla om container är idag
function section_is_today(timeStart: string): boolean {
  const d = new Date(timeStart)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
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
  headerTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  nowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  nowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.error,
  },
  nowText: {
    color: theme.colors.error,
    fontSize: 11,
    fontWeight: '600',
  },
  searchIcon: {
    fontSize: 18,
  },
  searchBar: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 10,
    color: theme.colors.text,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 24,
  },
  // Tidslinjemarkör
  nowMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginTop: 4,
    marginBottom: 2,
    gap: 6,
  },
  nowMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  nowMarkerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.error,
    opacity: 0.6,
  },
  nowMarkerText: {
    color: theme.colors.error,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalScroll: { flex: 1 },
  modalContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  modalTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  modalClose: {
    color: theme.colors.textMuted,
    fontSize: 18,
    padding: 4,
  },
  modalMeta: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalMetaText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  modalSection: {
    gap: theme.spacing.sm,
  },
  modalSectionLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  actionItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  actionItemNum: {
    color: theme.colors.accentLight,
    fontSize: 14,
    fontWeight: '600',
    width: 20,
  },
  actionItemText: {
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  modalNotes: {
    gap: theme.spacing.sm,
  },
  modalNotesLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  modalNotesText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  modalActions: {
    marginBottom: -theme.spacing.sm,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  berntBtn: {
    backgroundColor: 'rgba(109, 58, 238, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(109, 58, 238, 0.4)',
    borderRadius: theme.radius.md,
    padding: 14,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  berntBtnText: {
    color: theme.colors.accentLight,
    fontSize: 15,
    fontWeight: '600',
  },
  executeBtn: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    padding: 14,
    alignItems: 'center',
  },
  executeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  delegateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    alignItems: 'center',
  },
  delegateBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
})
