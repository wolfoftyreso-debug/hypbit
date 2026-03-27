import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  supabase,
  type CorpEntity,
  type CorpBoardMeeting,
  type CorpComplianceItem,
  type CorpJurisdictionRequirement,
  type CorpDocument,
} from '../../../lib/supabase'

// ─── Corporate Entities ───────────────────────────────────────────────────────

export function useCorpEntities() {
  return useQuery({
    queryKey: ['corp-entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corp_entities')
        .select('*')
        .order('name')
      if (error) throw error
      return data as CorpEntity[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCorpEntity(id: string) {
  return useQuery({
    queryKey: ['corp-entities', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corp_entities')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as CorpEntity
    },
    enabled: !!id,
  })
}

export function useUpdateCorpEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CorpEntity> & { id: string }) => {
      const { data, error } = await supabase
        .from('corp_entities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CorpEntity
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['corp-entities'] })
    },
  })
}

// ─── Board Meetings ───────────────────────────────────────────────────────────

type BoardMeetingFilters = {
  companyId?: string
  status?: CorpBoardMeeting['status']
  type?: CorpBoardMeeting['type']
}

export function useCorpBoardMeetings(filters?: BoardMeetingFilters) {
  return useQuery({
    queryKey: ['corp-board-meetings', filters],
    queryFn: async () => {
      let query = supabase
        .from('corp_board_meetings')
        .select('*')
        .order('date', { ascending: false })
      if (filters?.companyId) query = query.eq('company_id', filters.companyId)
      if (filters?.status)    query = query.eq('status', filters.status)
      if (filters?.type)      query = query.eq('type', filters.type)
      const { data, error } = await query
      if (error) throw error
      return data as CorpBoardMeeting[]
    },
  })
}

export function useCorpBoardMeeting(id: string) {
  return useQuery({
    queryKey: ['corp-board-meetings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corp_board_meetings')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as CorpBoardMeeting
    },
    enabled: !!id,
  })
}

export function useCreateBoardMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (meeting: Omit<CorpBoardMeeting, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('corp_board_meetings')
        .insert(meeting)
        .select()
        .single()
      if (error) throw error
      return data as CorpBoardMeeting
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corp-board-meetings'] }),
  })
}

export function useUpdateBoardMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CorpBoardMeeting> & { id: string }) => {
      const { data, error } = await supabase
        .from('corp_board_meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CorpBoardMeeting
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corp-board-meetings'] }),
  })
}

export function useUpdateBoardMeetingStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CorpBoardMeeting['status'] }) => {
      const { data, error } = await supabase
        .from('corp_board_meetings')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CorpBoardMeeting
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corp-board-meetings'] }),
  })
}

export function useDeleteBoardMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('corp_board_meetings')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corp-board-meetings'] }),
  })
}

// ─── Compliance Items ─────────────────────────────────────────────────────────

type ComplianceFilters = {
  companyId?: string
  status?: CorpComplianceItem['status']
  category?: CorpComplianceItem['category']
  owner?: string
}

export function useCorpComplianceItems(filters?: ComplianceFilters) {
  return useQuery({
    queryKey: ['corp-compliance-items', filters],
    queryFn: async () => {
      let query = supabase
        .from('corp_compliance_items')
        .select('*')
        .order('deadline', { ascending: true })
      if (filters?.companyId) query = query.eq('company_id', filters.companyId)
      if (filters?.status)    query = query.eq('status', filters.status)
      if (filters?.category)  query = query.eq('category', filters.category)
      if (filters?.owner)     query = query.eq('owner', filters.owner)
      const { data, error } = await query
      if (error) throw error
      return data as CorpComplianceItem[]
    },
  })
}

export function useCreateComplianceItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: Omit<CorpComplianceItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('corp_compliance_items')
        .insert(item)
        .select()
        .single()
      if (error) throw error
      return data as CorpComplianceItem
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corp-compliance-items'] }),
  })
}

export function useUpdateComplianceStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CorpComplianceItem['status'] }) => {
      const { data, error } = await supabase
        .from('corp_compliance_items')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CorpComplianceItem
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corp-compliance-items'] }),
  })
}

export function useUpdateComplianceItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CorpComplianceItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('corp_compliance_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CorpComplianceItem
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corp-compliance-items'] }),
  })
}

// ─── Jurisdiction Requirements ────────────────────────────────────────────────

export function useCorpJurisdictionRequirements(companyId?: string) {
  return useQuery({
    queryKey: ['corp-jurisdiction-requirements', companyId],
    queryFn: async () => {
      let query = supabase
        .from('corp_jurisdiction_requirements')
        .select('*')
        .order('deadline', { ascending: true })
      if (companyId) query = query.eq('company_id', companyId)
      const { data, error } = await query
      if (error) throw error
      return data as CorpJurisdictionRequirement[]
    },
  })
}

export function useUpdateJurisdictionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CorpJurisdictionRequirement['status'] }) => {
      const { data, error } = await supabase
        .from('corp_jurisdiction_requirements')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CorpJurisdictionRequirement
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corp-jurisdiction-requirements'] }),
  })
}

// ─── Documents ────────────────────────────────────────────────────────────────

type DocumentFilters = {
  companyId?: string
  category?: CorpDocument['category']
  status?: CorpDocument['status']
}

export function useCorpDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['corp-documents', filters],
    queryFn: async () => {
      let query = supabase
        .from('corp_documents')
        .select('*')
        .order('date', { ascending: false })
      if (filters?.companyId) query = query.eq('company_id', filters.companyId)
      if (filters?.category)  query = query.eq('category', filters.category)
      if (filters?.status)    query = query.eq('status', filters.status)
      const { data, error } = await query
      if (error) throw error
      return data as CorpDocument[]
    },
  })
}

export function useCreateCorpDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (doc: Omit<CorpDocument, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('corp_documents')
        .insert(doc)
        .select()
        .single()
      if (error) throw error
      return data as CorpDocument
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corp-documents'] }),
  })
}

export function useUpdateDocumentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CorpDocument['status'] }) => {
      const { data, error } = await supabase
        .from('corp_documents')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CorpDocument
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corp-documents'] }),
  })
}

// ─── Compliance Overview Stats ────────────────────────────────────────────────

export function useCorpComplianceStats() {
  return useQuery({
    queryKey: ['corp-compliance-stats'],
    queryFn: async () => {
      const [complianceRes, jurisdictionRes] = await Promise.all([
        supabase.from('corp_compliance_items').select('status, deadline, company_id'),
        supabase.from('corp_jurisdiction_requirements').select('status, deadline, company_id'),
      ])
      if (complianceRes.error) throw complianceRes.error
      if (jurisdictionRes.error) throw jurisdictionRes.error

      const today = new Date().toISOString().split('T')[0]

      const overdue = [
        ...complianceRes.data.filter(i => i.status === 'ej påbörjad' && i.deadline && i.deadline < today),
        ...jurisdictionRes.data.filter(i => i.status === 'ej inlämnad' && i.deadline && i.deadline < today),
      ].length

      const dueIn30 = [
        ...complianceRes.data.filter(i =>
          !['klar'].includes(i.status) && i.deadline &&
          i.deadline >= today &&
          i.deadline <= new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        ),
        ...jurisdictionRes.data.filter(i =>
          i.status === 'ej inlämnad' && i.deadline &&
          i.deadline >= today &&
          i.deadline <= new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        ),
      ].length

      const completed = [
        ...complianceRes.data.filter(i => i.status === 'klar'),
        ...jurisdictionRes.data.filter(i => i.status === 'betald'),
      ].length

      const total = complianceRes.data.length + jurisdictionRes.data.length

      return { overdue, dueIn30, completed, total }
    },
  })
}
