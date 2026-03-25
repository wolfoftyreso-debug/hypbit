// ─── Wavult App — Avatar Context ────────────────────────────────────────────
// Unified avatar system. One photo upload triggers:
//   1. Supabase Storage → profile picture
//   2. Duix API → digital human clone of your face
//
// The operator never thinks about "creating a digital human" — they just
// set their profile photo, and the system does the rest.

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from './supabase'

// ─── Configuration ───────────────────────────────────────────────────────────

const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const DUIX_API_BASE = 'https://app.duix.ai/duix-openapi-v2/sdk/v2'
const DUIX_TOKEN = import.meta.env.VITE_DUIX_TOKEN || ''
const DUIX_CONVERSATION_ID = import.meta.env.VITE_DUIX_CONVERSATION_ID || ''

// ─── Duix face clone helper ─────────────────────────────────────────────────

interface DuixCloneResult {
  success: boolean
  avatarId?: string
  error?: string
}

async function createDuixFaceClone(
  imageUrl: string,
  operatorName: string,
): Promise<DuixCloneResult> {
  if (!DUIX_TOKEN || !DUIX_CONVERSATION_ID) {
    return { success: false, error: 'Duix not configured' }
  }

  try {
    const res = await fetch(`${DUIX_API_BASE}/createAvatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': DUIX_TOKEN,
      },
      body: JSON.stringify({
        conversationId: DUIX_CONVERSATION_ID,
        name: operatorName,
        ttsName: 'Marin',
        greetings: `Welcome back, ${operatorName.split(' ')[0]}. Ready when you are.`,
        profile: 'You are the Wavult OS operator interface. Present tasks and coaching concisely, like a mission controller.',
        // Face clone from uploaded photo
        faceUrl: imageUrl,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `Duix API ${res.status}: ${text}` }
    }

    const data = await res.json()
    return {
      success: true,
      avatarId: data?.data?.avatarId || data?.data?.id || DUIX_CONVERSATION_ID,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AvatarContextValue {
  avatarUrl: string | null
  /** Duix avatar clone status */
  duixCloneStatus: 'idle' | 'cloning' | 'ready' | 'failed'
  duixAvatarId: string | null
  isUploaderOpen: boolean
  openUploader: () => void
  closeUploader: () => void
  uploadAvatar: (file: File) => Promise<{ error: string | null }>
  removeAvatar: () => Promise<void>
  saving: boolean
}

const AvatarContext = createContext<AvatarContextValue | null>(null)

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploaderOpen, setIsUploaderOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [duixCloneStatus, setDuixCloneStatus] = useState<'idle' | 'cloning' | 'ready' | 'failed'>('idle')
  const [duixAvatarId, setDuixAvatarId] = useState<string | null>(null)

  // Load avatar + Duix status from user metadata
  useEffect(() => {
    if (!user) return
    const url = user.user_metadata?.avatar_url
    setAvatarUrl(typeof url === 'string' ? url : null)

    const dId = user.user_metadata?.duix_avatar_id
    if (typeof dId === 'string') {
      setDuixAvatarId(dId)
      setDuixCloneStatus('ready')
    }
  }, [user])

  const openUploader = useCallback(() => setIsUploaderOpen(true), [])
  const closeUploader = useCallback(() => setIsUploaderOpen(false), [])

  const uploadAvatar = useCallback(async (file: File): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' }

    // Validate
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return { error: 'Only JPEG, PNG, and WebP are supported' }
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: 'File too large (max 5 MB)' }
    }

    setSaving(true)
    try {
      // ── Step 1: Upload to Supabase Storage ──────────────────────────────
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) return { error: uploadError.message }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(path)

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      // Save profile photo URL to user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      })

      if (updateError) return { error: updateError.message }

      setAvatarUrl(publicUrl)
      setIsUploaderOpen(false)

      // ── Step 2: Create Duix face clone (async, non-blocking) ────────────
      if (DUIX_TOKEN && DUIX_CONVERSATION_ID) {
        setDuixCloneStatus('cloning')
        const operatorName = user.user_metadata?.full_name || user.email || 'Operator'

        // Fire and don't block the UI
        createDuixFaceClone(publicUrl, operatorName).then(async (result) => {
          if (result.success && result.avatarId) {
            setDuixAvatarId(result.avatarId)
            setDuixCloneStatus('ready')
            // Persist Duix avatar ID to user metadata
            await supabase.auth.updateUser({
              data: { duix_avatar_id: result.avatarId },
            })
          } else {
            setDuixCloneStatus('failed')
            console.warn('[Duix] Face clone failed:', result.error)
          }
        })
      }

      return { error: null }
    } finally {
      setSaving(false)
    }
  }, [user])

  const removeAvatar = useCallback(async () => {
    if (!user) return
    setSaving(true)
    try {
      for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
        await supabase.storage.from(AVATAR_BUCKET).remove([`${user.id}.${ext}`])
      }
      await supabase.auth.updateUser({
        data: { avatar_url: null, duix_avatar_id: null },
      })
      setAvatarUrl(null)
      setDuixAvatarId(null)
      setDuixCloneStatus('idle')
    } finally {
      setSaving(false)
    }
  }, [user])

  return (
    <AvatarContext.Provider value={{
      avatarUrl, duixCloneStatus, duixAvatarId, isUploaderOpen,
      openUploader, closeUploader, uploadAvatar, removeAvatar, saving,
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
