// ─── Wavult App — Avatar Context ────────────────────────────────────────────────
// Ready Player Me integration. Stores avatar URL in Supabase user_metadata.
// Renders 2D portraits from the 3D avatar via RPM render API.
//
// Ready Player Me render API:
//   https://models.readyplayer.me/{avatarId}.png
//   ?scene=fullbody-portrait-v1
//   &size=256
//   &background=0,0,0,0  (transparent)
//
// The avatarId is extracted from the full .glb URL that RPM returns.

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from './supabase'

// ─── RPM Configuration ──────────────────────────────────────────────────────
// Uses 'demo' subdomain by default (works without registration).
// Set VITE_RPM_SUBDOMAIN to your own subdomain after registering at studio.readyplayer.me

const RPM_SUBDOMAIN = import.meta.env.VITE_RPM_SUBDOMAIN || 'demo'
const RPM_IFRAME_URL = `https://${RPM_SUBDOMAIN}.readyplayer.me/avatar?frameApi`

// Render API base — works with any avatarId
const RPM_RENDER_BASE = 'https://models.readyplayer.me'

export type AvatarSize = 128 | 256 | 512 | 1024

export interface AvatarRenderOptions {
  scene?: 'fullbody-portrait-v1' | 'halfbody-portrait-v1' | 'fullbody-posture-v1'
  size?: AvatarSize
  transparent?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract avatar ID from RPM .glb URL */
function extractAvatarId(glbUrl: string): string | null {
  // URL format: https://models.readyplayer.me/64f1234abcdef.glb
  const match = glbUrl.match(/models\.readyplayer\.me\/([a-f0-9]+)\.glb/i)
  if (match) return match[1]
  // Also try just a hex string (if stored as ID only)
  if (/^[a-f0-9]{24}$/i.test(glbUrl)) return glbUrl
  return null
}

/** Build render URL for 2D portrait from avatar ID */
export function getAvatarRenderUrl(
  avatarIdOrUrl: string,
  options: AvatarRenderOptions = {}
): string {
  const id = extractAvatarId(avatarIdOrUrl) || avatarIdOrUrl
  const {
    scene = 'halfbody-portrait-v1',
    size = 256,
    transparent = true,
  } = options

  const bg = transparent ? '0,0,0,0' : '20,24,30,255'
  return `${RPM_RENDER_BASE}/${id}.png?scene=${scene}&size=${size}&background=${bg}`
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AvatarContextValue {
  /** Full .glb URL or avatar ID stored in user metadata */
  avatarUrl: string | null
  /** 2D rendered portrait URL (ready to use in <img>) */
  portraitUrl: string | null
  /** Whether the avatar creation modal is open */
  isCreatorOpen: boolean
  /** Open the RPM avatar creator */
  openCreator: () => void
  /** Close the creator */
  closeCreator: () => void
  /** Save a new avatar URL (called by the creator iframe) */
  saveAvatar: (glbUrl: string) => Promise<void>
  /** Remove avatar */
  removeAvatar: () => Promise<void>
  /** Loading state */
  saving: boolean
}

const AvatarContext = createContext<AvatarContextValue | null>(null)

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isCreatorOpen, setIsCreatorOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load avatar from user metadata on mount
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url)
    } else {
      setAvatarUrl(null)
    }
  }, [user])

  const portraitUrl = avatarUrl ? getAvatarRenderUrl(avatarUrl) : null

  const openCreator = useCallback(() => setIsCreatorOpen(true), [])
  const closeCreator = useCallback(() => setIsCreatorOpen(false), [])

  const saveAvatar = useCallback(async (glbUrl: string) => {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: glbUrl },
      })
      if (error) throw error
      setAvatarUrl(glbUrl)
      setIsCreatorOpen(false)
    } finally {
      setSaving(false)
    }
  }, [])

  const removeAvatar = useCallback(async () => {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      })
      if (error) throw error
      setAvatarUrl(null)
    } finally {
      setSaving(false)
    }
  }, [])

  return (
    <AvatarContext.Provider value={{
      avatarUrl, portraitUrl, isCreatorOpen,
      openCreator, closeCreator, saveAvatar, removeAvatar, saving,
    }}>
      {children}
    </AvatarContext.Provider>
  )
}

export function useAvatar() {
  const ctx = useContext(AvatarContext)
  if (!ctx) throw new Error('useAvatar must be used inside AvatarProvider')
  return ctx
}

export { RPM_IFRAME_URL }
