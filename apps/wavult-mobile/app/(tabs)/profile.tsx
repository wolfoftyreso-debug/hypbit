import { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SemanticDataViewer } from '../../components/profile/SemanticDataViewer'
import { DataControlPanel } from '../../components/profile/DataControlPanel'
import { BerntAvatar } from '../../components/chat/BerntAvatar'
import { useStore } from '../../lib/store'
import { logout } from '../../lib/auth'
import { MOCK_SEMANTIC_PROFILE } from '../../lib/mockData'
import { theme } from '../../constants/theme'

export default function ProfileScreen() {
  const router = useRouter()
  const { user, setUser, semanticProfile, updateSemanticProfile } = useStore()

  useEffect(() => {
    if (!semanticProfile) {
      updateSemanticProfile(MOCK_SEMANTIC_PROFILE)
    }
  }, [])

  async function handleLogout() {
    Alert.alert('Logga ut?', 'Du loggas ut från WAVULT OS.', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Logga ut',
        style: 'destructive',
        onPress: async () => {
          await logout()
          setUser(null)
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  function handleDeleteSemantic() {
    updateSemanticProfile({
      decisionStyle: '—',
      focusHours: '—',
      delegationLevel: '—',
      riskAppetite: '—',
      decisionHistory: [],
    })
  }

  function handleBerntChat(query?: string) {
    router.push({
      pathname: '/(tabs)',
      params: query ? { berntQuery: query } : {},
    })
  }

  if (!user) return null

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFIL</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar & Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileRole}>{user.role}</Text>
            <Text style={styles.profileOrg}>{user.organization}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bernt Section */}
        <View style={styles.berntSection}>
          <Text style={styles.sectionLabel}>BERNT — DIN AI-OPERATÖR</Text>
          <View style={styles.berntCard}>
            <View style={styles.berntCardTop}>
              <BerntAvatar />
              <View style={styles.berntInfo}>
                <View style={styles.berntStatusRow}>
                  <View style={styles.berntActiveDot} />
                  <Text style={styles.berntStatusText}>Bernt är aktiv</Text>
                </View>
                <Text style={styles.berntSubText}>Kopplad till Wavult OS v2</Text>
                <Text style={styles.berntSubText}>Senast aktiv: nu</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.berntBtn}
              onPress={() => handleBerntChat('Vad kan du göra?')}
              activeOpacity={0.8}
            >
              <Text style={styles.berntBtnText}>Berätta om dig</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Semantic Profile */}
        {semanticProfile && <SemanticDataViewer profile={semanticProfile} />}

        <View style={styles.divider} />

        {/* Data Controls */}
        <DataControlPanel
          onViewAll={() => Alert.alert('Se all data', 'Kommer i fas 2.')}
          onExport={() => Alert.alert('Exportera', 'Export-funktion kommer i fas 2.')}
          onDeleteSemantic={handleDeleteSemantic}
        />

        <View style={styles.divider} />

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logga ut</Text>
        </TouchableOpacity>

        <Text style={styles.version}>WAVULT OS v2 · Bernt AI · © 2026 Wavult Group</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
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
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  profileRole: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  profileOrg: {
    color: theme.colors.accentLight,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  // Bernt Section
  berntSection: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  berntCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  berntCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  berntInfo: {
    flex: 1,
    gap: 3,
  },
  berntStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  berntActiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.success,
  },
  berntStatusText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  berntSubText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  berntBtn: {
    backgroundColor: 'rgba(109, 58, 238, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  berntBtnText: {
    color: theme.colors.accentLight,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  version: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 1,
  },
})
