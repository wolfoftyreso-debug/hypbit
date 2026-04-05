// Project Memory Graph
// Persistent kontext per projekt — sparas till wavult-core och Gitea

import { useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'https://api.wavult.com'
const GITEA_URL = import.meta.env.VITE_GITEA_URL ?? 'https://git.wavult.com'
const GITEA_TOKEN = import.meta.env.VITE_GITEA_TOKEN ?? ''

// ── TYPER ──────────────────────────────────────────────────────────────────

export interface ComponentNode {
  id: string
  name: string
  path: string
  type: 'page' | 'component' | 'hook' | 'util' | 'api' | 'store'
  description: string
  dependencies: string[]      // andra component IDs
  api_endpoints: string[]     // vilka endpoints den anropar
  last_modified: string
}

export interface RouteNode {
  id: string
  path: string                // '/dashboard', '/code/:id' etc
  component: string           // component ID
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  auth_required: boolean
  status: 'active' | 'empty' | 'broken' | 'planned'
  description: string
}

export interface SchemaNode {
  id: string
  table: string
  columns: Array<{ name: string; type: string; nullable: boolean }>
  relations: Array<{ table: string; type: 'hasMany' | 'belongsTo' | 'manyToMany' }>
  description: string
}

export interface DecisionLog {
  id: string
  timestamp: string
  decision: string            // "Valde att använda fetch istället för axios"
  rationale: string           // "Minskar bundle-storlek med ~30kb"
  made_by: 'ai' | 'human'
  affected_files: string[]
}

export interface Constraint {
  id: string
  rule: string                // "NO_SUPABASE"
  description: string
  severity: 'critical' | 'error' | 'warning'
  source: 'wavult-global' | 'project-specific'
}

export interface ProjectMemory {
  project_id: string          // repo full_name
  project_name: string
  last_updated: string
  components: ComponentNode[]
  routes: RouteNode[]
  schemas: SchemaNode[]
  decisions: DecisionLog[]
  constraints: Constraint[]
  tech_stack: Record<string, string>  // { react: '18.2', typescript: '5.0' }
  open_issues: Array<{ id: string; description: string; priority: 'high' | 'medium' | 'low' }>
  ai_context: string          // sammanfattning för AI-agenten
}

// ── GLOBAL WAVULT CONSTRAINTS (alltid med) ─────────────────────────────────

export const GLOBAL_CONSTRAINTS: Constraint[] = [
  { id: 'gc-1', rule: 'NO_SUPABASE', description: 'Supabase client forbidden. Use wavult-core API.', severity: 'critical', source: 'wavult-global' },
  { id: 'gc-2', rule: 'NO_HARDCODE', description: 'No hardcoded credentials, URLs, or IDs.', severity: 'critical', source: 'wavult-global' },
  { id: 'gc-3', rule: 'NO_MOCK_PROD', description: 'No mock data in production builds.', severity: 'error', source: 'wavult-global' },
  { id: 'gc-4', rule: 'BRAND_COLORS', description: 'Use Wavult design tokens: #F5F0E8, #0A3D62, #E8B84B.', severity: 'warning', source: 'wavult-global' },
  { id: 'gc-5', rule: 'FULL_REACTIVITY', description: 'All data must come from API. No static data.', severity: 'error', source: 'wavult-global' },
  { id: 'gc-6', rule: 'NO_EMPTY_ROUTES', description: 'All routes must be wired. Empty routes = CRITICAL.', severity: 'critical', source: 'wavult-global' },
  { id: 'gc-7', rule: 'USE_WAVULT_SDK', description: 'Use @wavult/sdk for all API calls.', severity: 'error', source: 'wavult-global' },
]

// ── MEMORY PERSISTENCE ─────────────────────────────────────────────────────

const MEMORY_FILE = '.wavult/memory.json'

export async function loadMemory(repoFullName: string): Promise<ProjectMemory | null> {
  // Försök hämta från Gitea (sparad i .wavult/memory.json)
  try {
    const res = await fetch(
      `${GITEA_URL}/api/v1/repos/${repoFullName}/raw/${MEMORY_FILE}`,
      { headers: { Authorization: `token ${GITEA_TOKEN}` } }
    )
    if (res.ok) {
      const data = await res.json()
      return { ...data, constraints: [...GLOBAL_CONSTRAINTS, ...(data.constraints ?? [])] }
    }
  } catch { /* filen finns inte ännu */ }

  // Försök hämta från wavult-core cache
  try {
    const res = await fetch(`${API}/api/code/memory/${encodeURIComponent(repoFullName)}`, {
      headers: { Authorization: 'Bearer bypass' }
    })
    if (res.ok) return res.json()
  } catch { /* offline */ }

  return null
}

export async function saveMemory(repoFullName: string, memory: ProjectMemory): Promise<void> {
  const content = JSON.stringify(memory, null, 2)
  const encoded = btoa(unescape(encodeURIComponent(content)))

  // Spara till Gitea
  try {
    const existing = await fetch(
      `${GITEA_URL}/api/v1/repos/${repoFullName}/contents/${MEMORY_FILE}`,
      { headers: { Authorization: `token ${GITEA_TOKEN}` } }
    ).then(r => r.json()).catch(() => null)

    await fetch(`${GITEA_URL}/api/v1/repos/${repoFullName}/contents/${MEMORY_FILE}`, {
      method: existing?.sha ? 'PUT' : 'POST',
      headers: { Authorization: `token ${GITEA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `chore: update project memory [${new Date().toISOString().slice(0, 10)}]`,
        content: encoded,
        ...(existing?.sha ? { sha: existing.sha } : {}),
        committer: { name: 'Wavult OS', email: 'os@wavult.com' },
      })
    })
  } catch { /* non-blocking */ }

  // Spara till wavult-core cache
  fetch(`${API}/api/code/memory/${encodeURIComponent(repoFullName)}`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer bypass', 'Content-Type': 'application/json' },
    body: content,
  }).catch(() => {})
}

// ── MEMORY BUILDER (från filträd + package.json) ───────────────────────────

export async function buildMemoryFromRepo(repoFullName: string): Promise<Partial<ProjectMemory>> {
  const partial: Partial<ProjectMemory> = {
    project_id: repoFullName,
    project_name: repoFullName.split('/')[1],
    last_updated: new Date().toISOString(),
    constraints: GLOBAL_CONSTRAINTS,
    components: [],
    routes: [],
    decisions: [],
    schemas: [],
    open_issues: [],
    tech_stack: {},
  }

  // Hämta package.json för tech stack
  try {
    const res = await fetch(
      `${GITEA_URL}/api/v1/repos/${repoFullName}/raw/package.json`,
      { headers: { Authorization: `token ${GITEA_TOKEN}` } }
    )
    if (res.ok) {
      const pkg = await res.json()
      partial.tech_stack = {
        ...Object.fromEntries(Object.entries(pkg.dependencies ?? {}).map(([k, v]) => [k, v as string])),
      }
    }
  } catch { /* ingen package.json */ }

  // Hämta filträd och bygg komponentlista
  try {
    const treeRes = await fetch(
      `${GITEA_URL}/api/v1/repos/${repoFullName}/git/trees/HEAD?recursive=true`,
      { headers: { Authorization: `token ${GITEA_TOKEN}` } }
    )
    if (treeRes.ok) {
      const tree = await treeRes.json()
      const files = (tree.tree ?? []).filter((f: { type: string }) => f.type === 'blob') as Array<{ path: string; type: string }>

      // Identifiera sidor och komponenter
      for (const file of files) {
        if (file.path.includes('node_modules')) continue

        if (/\/pages\/.*\.tsx?$/.test(file.path) || /App\.tsx$/.test(file.path)) {
          partial.components?.push({
            id: file.path,
            name: file.path.split('/').pop()?.replace(/\.tsx?$/, '') ?? '',
            path: file.path,
            type: 'page',
            description: '',
            dependencies: [],
            api_endpoints: [],
            last_modified: new Date().toISOString(),
          })
        }
      }

      // Hitta routes i App.tsx
      const appFile = files.find((f) => f.path.endsWith('App.tsx') || f.path.endsWith('app.tsx'))
      if (appFile) {
        const content = await fetch(
          `${GITEA_URL}/api/v1/repos/${repoFullName}/raw/${appFile.path}`,
          { headers: { Authorization: `token ${GITEA_TOKEN}` } }
        ).then(r => r.text()).catch(() => '')

        // Extrahera routes
        const routeMatches = content.matchAll(/path="([^"]+)"/g)
        for (const match of routeMatches) {
          partial.routes?.push({
            id: `route-${match[1].replace(/\//g, '-')}`,
            path: match[1],
            component: '',
            auth_required: true,
            status: 'active',
            description: '',
          })
        }
      }
    }
  } catch { /* offline */ }

  // Bygga AI-kontext sammanfattning
  partial.ai_context = `
Project: ${partial.project_name}
Tech: ${Object.keys(partial.tech_stack ?? {}).slice(0, 10).join(', ')}
Routes: ${partial.routes?.length ?? 0} (${partial.routes?.filter(r => r.status === 'empty').length ?? 0} tomma)
Components: ${partial.components?.length ?? 0}
Global constraints: ${GLOBAL_CONSTRAINTS.length} regler aktiva

CRITICAL RULES:
${GLOBAL_CONSTRAINTS.filter(c => c.severity === 'critical').map(c => `- ${c.rule}: ${c.description}`).join('\n')}
`.trim()

  return partial
}

// ── REACT HOOK ─────────────────────────────────────────────────────────────

export function useProjectMemory(repoFullName: string | null) {
  const [memory, setMemory] = useState<ProjectMemory | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!repoFullName) return
    setLoading(true)
    loadMemory(repoFullName)
      .then(m => {
        if (m) {
          setMemory(m)
        } else {
          // Bygg från repo om ingen sparad memory finns
          buildMemoryFromRepo(repoFullName).then(partial => {
            const newMemory: ProjectMemory = {
              components: [],
              routes: [],
              schemas: [],
              decisions: [],
              open_issues: [],
              tech_stack: {},
              ai_context: '',
              ...partial,
              project_id: repoFullName,
              project_name: repoFullName.split('/')[1] ?? repoFullName,
              last_updated: new Date().toISOString(),
              constraints: GLOBAL_CONSTRAINTS,
            }
            setMemory(newMemory)
            saveMemory(repoFullName, newMemory)
          })
        }
      })
      .finally(() => setLoading(false))
  }, [repoFullName])

  const addDecision = useCallback((decision: Omit<DecisionLog, 'id' | 'timestamp'>) => {
    if (!memory || !repoFullName) return
    const updated: ProjectMemory = {
      ...memory,
      decisions: [
        { ...decision, id: `dec-${Date.now()}`, timestamp: new Date().toISOString() },
        ...memory.decisions,
      ],
      last_updated: new Date().toISOString(),
    }
    setMemory(updated)
    saveMemory(repoFullName, updated)
  }, [memory, repoFullName])

  const flagEmptyRoute = useCallback((path: string) => {
    if (!memory || !repoFullName) return
    const updated: ProjectMemory = {
      ...memory,
      routes: memory.routes.map(r => r.path === path ? { ...r, status: 'empty' as const } : r),
      open_issues: [
        ...memory.open_issues,
        { id: `issue-${Date.now()}`, description: `Tom route: ${path}`, priority: 'high' as const }
      ],
    }
    setMemory(updated)
    saveMemory(repoFullName, updated)
  }, [memory, repoFullName])

  return { memory, loading, addDecision, flagEmptyRoute }
}
