import { useQuery } from '@tanstack/react-query'

const GITEA_URL = import.meta.env.VITE_GITEA_URL ?? 'https://git.wavult.com'
const GITEA_TOKEN = import.meta.env.VITE_GITEA_TOKEN ?? ''

export interface GiteaRepo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  ssh_url: string
  clone_url: string
  default_branch: string
  updated_at: string
  language: string
  topics: string[]
  website: string
  empty: boolean
  size: number
}

export interface GiteaBranch {
  name: string
  commit: { id: string; message: string; timestamp: string }
  protected: boolean
}

export function useGiteaRepos() {
  return useQuery({
    queryKey: ['gitea-repos'],
    queryFn: async () => {
      const res = await fetch(`${GITEA_URL}/api/v1/repos/search?limit=50&sort=updated`, {
        headers: { 'Authorization': `token ${GITEA_TOKEN}` }
      })
      if (!res.ok) throw new Error(`Gitea API ${res.status}`)
      const data = await res.json()
      return data.data as GiteaRepo[]
    },
    staleTime: 1000 * 60 * 2, // 2 min cache
  })
}

export function useGiteaBranches(repoFullName: string) {
  return useQuery({
    queryKey: ['gitea-branches', repoFullName],
    queryFn: async () => {
      const res = await fetch(`${GITEA_URL}/api/v1/repos/${repoFullName}/branches`, {
        headers: { 'Authorization': `token ${GITEA_TOKEN}` }
      })
      if (!res.ok) return []
      return await res.json() as GiteaBranch[]
    },
    enabled: !!repoFullName,
    staleTime: 1000 * 60 * 5,
  })
}
