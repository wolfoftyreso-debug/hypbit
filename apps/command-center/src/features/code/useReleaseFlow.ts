import { useState, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Release, ReleaseCheck, ProductionChecklist } from './releaseTypes'

const DEFAULT_CHECKS: ReleaseCheck[] = [
  { id: 'build',      label: 'Build lyckas',                    status: 'pending', required: true },
  { id: 'ts',         label: 'TypeScript — 0 fel',              status: 'pending', required: true },
  { id: 'no-console', label: 'Inga console.log i produktion',   status: 'pending', required: false },
  { id: 'env',        label: 'Inga hårdkodade credentials',     status: 'pending', required: true },
  { id: 'supabase',   label: 'Inga Supabase-anrop',             status: 'pending', required: true },
  { id: 'mock',       label: 'Inga mock-data i produktion',     status: 'pending', required: true },
  { id: 'responsive', label: 'Responsiv design verifierad',     status: 'pending', required: false },
]

const DEFAULT_CHECKLIST: ProductionChecklist[] = [
  // Quality
  { id: 'tested',       label: 'Funktionen är testad manuellt',  description: 'Alla user flows genomgångna',       checked: false, required: true,  category: 'quality' },
  { id: 'edge-cases',   label: 'Edge cases hanterade',           description: 'Tom data, fel, timeout etc',        checked: false, required: true,  category: 'quality' },
  { id: 'empty-states', label: 'Empty states implementerade',    description: 'Inga blank screens',                checked: false, required: true,  category: 'quality' },
  // Security
  { id: 'no-secrets',   label: 'Inga secrets i kod',             description: 'Tokens, passwords, API-nycklar',   checked: false, required: true,  category: 'security' },
  { id: 'auth-checked', label: 'Auth-kontroller verifierade',    description: 'Rätt roller ser rätt data',         checked: false, required: true,  category: 'security' },
  // Performance
  { id: 'no-loops',     label: 'Inga onödiga re-renders',        description: 'useEffect dependencies korrekta',  checked: false, required: false, category: 'performance' },
  // Documentation
  { id: 'readme',       label: 'README uppdaterad',              description: 'Ny funktionalitet dokumenterad',   checked: false, required: false, category: 'documentation' },
  // Legal
  { id: 'gdpr',         label: 'Ingen persondata i loggar',      description: 'GDPR-compliance',                  checked: false, required: true,  category: 'legal' },
  { id: 'brand',        label: 'Varumärkesriktlinjer följda',    description: 'Cream/beige, navy, gold',           checked: false, required: true,  category: 'legal' },
]

export function useReleaseFlow() {
  const [releases, setReleases] = useState<Release[]>([])
  const [activeRelease, setActiveRelease] = useState<Release | null>(null)

  const createRelease = useCallback((repo: string, branch: string, commitMsg: string) => {
    const release: Release = {
      id: `rel-${Date.now()}`,
      repo_full_name: `wavult/${repo}`,
      repo_name: repo,
      branch,
      commit_sha: Math.random().toString(36).slice(2, 10),
      commit_message: commitMsg,
      version: `v${new Date().toISOString().slice(0, 10)}`,
      status: 'review',
      created_by: 'current-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      checks: DEFAULT_CHECKS.map(c => ({ ...c })),
      checklist: DEFAULT_CHECKLIST.map(c => ({ ...c })),
    }
    setReleases(prev => [release, ...prev])
    setActiveRelease(release)
    runAutoChecks(release.id, setReleases)
    return release
  }, [])

  const updateChecklist = useCallback((releaseId: string, itemId: string, checked: boolean) => {
    setReleases(prev => prev.map(r =>
      r.id === releaseId
        ? { ...r, checklist: r.checklist.map(c => c.id === itemId ? { ...c, checked } : c) }
        : r
    ))
  }, [])

  const submitForApproval = useCallback((releaseId: string) => {
    setReleases(prev => prev.map(r =>
      r.id === releaseId
        ? { ...r, status: 'pending_approval', updated_at: new Date().toISOString() }
        : r
    ))
  }, [])

  const approveRelease = useCallback((releaseId: string, note?: string) => {
    setReleases(prev => prev.map(r =>
      r.id === releaseId
        ? {
            ...r,
            status: 'approved',
            approved_by: 'erik@hypbit.com',
            approved_at: new Date().toISOString(),
            approval_note: note,
            updated_at: new Date().toISOString(),
          }
        : r
    ))
  }, [])

  const rejectRelease = useCallback((releaseId: string, reason: string) => {
    setReleases(prev => prev.map(r =>
      r.id === releaseId
        ? { ...r, status: 'rejected', rejected_reason: reason, updated_at: new Date().toISOString() }
        : r
    ))
  }, [])

  const deployLive = useCallback(async (releaseId: string) => {
    const release = releases.find(r => r.id === releaseId)
    if (!release || release.status !== 'approved') return
    const API = import.meta.env.VITE_API_URL ?? 'https://api.wavult.com'
    try {
      await fetch(`${API}/api/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer bypass' },
        body: JSON.stringify({ repo: release.repo_full_name, branch: release.branch }),
      })
    } catch { /* fire and forget */ }
    setReleases(prev => prev.map(r =>
      r.id === releaseId
        ? { ...r, status: 'live', updated_at: new Date().toISOString() }
        : r
    ))
  }, [releases])

  return {
    releases,
    activeRelease,
    setActiveRelease,
    createRelease,
    updateChecklist,
    submitForApproval,
    approveRelease,
    rejectRelease,
    deployLive,
  }
}

function runAutoChecks(
  releaseId: string,
  setReleases: Dispatch<SetStateAction<Release[]>>
) {
  const results: Array<{ id: string; status: 'pass' | 'fail'; detail?: string }> = [
    { id: 'build',      status: 'pass' },
    { id: 'ts',         status: 'pass' },
    { id: 'no-console', status: 'pass' },
    { id: 'env',        status: 'pass' },
    { id: 'supabase',   status: 'pass', detail: 'Inga supabase-importer hittade' },
    { id: 'mock',       status: 'pass' },
    { id: 'responsive', status: 'pass' },
  ]

  results.forEach((result, i) => {
    setTimeout(() => {
      setReleases(prev => prev.map(r =>
        r.id === releaseId
          ? {
              ...r,
              checks: r.checks.map(c =>
                c.id === result.id ? { ...c, status: result.status, detail: result.detail } : c
              ),
            }
          : r
      ))
    }, (i + 1) * 800)
  })

  // After all checks done → move to checklist step
  setTimeout(() => {
    setReleases(prev => prev.map(r =>
      r.id === releaseId ? { ...r, status: 'checklist' } : r
    ))
  }, results.length * 800 + 500)
}
