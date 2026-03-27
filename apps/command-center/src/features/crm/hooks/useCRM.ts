import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  supabase,
  type CrmContact,
  type CrmProspect,
  type CrmDeal,
  type CrmActivity,
} from '../../../lib/supabase'

// ─── Contacts ─────────────────────────────────────────────────────────────────

export function useCrmContacts(search?: string) {
  return useQuery({
    queryKey: ['crm-contacts', search],
    queryFn: async () => {
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .order('name')
      if (search) {
        query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data as CrmContact[]
    },
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contact: Omit<CrmContact, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(contact)
        .select()
        .single()
      if (error) throw error
      return data as CrmContact
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts'] }),
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmContact> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CrmContact
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts'] }),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contacts'] }),
  })
}

// ─── Prospects ────────────────────────────────────────────────────────────────

type ProspectFilters = {
  stage?: CrmProspect['stage']
  assignee?: CrmProspect['assignee']
  product?: CrmProspect['product']
}

export function useCrmProspects(filters?: ProspectFilters) {
  return useQuery({
    queryKey: ['crm-prospects', filters],
    queryFn: async () => {
      let query = supabase
        .from('crm_prospects')
        .select('*')
        .order('last_activity', { ascending: false })
      if (filters?.stage)    query = query.eq('stage', filters.stage)
      if (filters?.assignee) query = query.eq('assignee', filters.assignee)
      if (filters?.product)  query = query.eq('product', filters.product)
      const { data, error } = await query
      if (error) throw error
      return data as CrmProspect[]
    },
  })
}

export function useCrmProspect(id: string) {
  return useQuery({
    queryKey: ['crm-prospects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_prospects')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as CrmProspect
    },
    enabled: !!id,
  })
}

export function useCreateProspect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (prospect: Omit<CrmProspect, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('crm_prospects')
        .insert(prospect)
        .select()
        .single()
      if (error) throw error
      return data as CrmProspect
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-prospects'] }),
  })
}

export function useUpdateProspect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmProspect> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_prospects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CrmProspect
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-prospects'] }),
  })
}

export function useUpdateProspectStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: CrmProspect['stage'] }) => {
      const { data, error } = await supabase
        .from('crm_prospects')
        .update({ stage, days_in_stage: 0 })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CrmProspect
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-prospects'] }),
  })
}

export function useDeleteProspect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_prospects')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-prospects'] }),
  })
}

// ─── Deals ────────────────────────────────────────────────────────────────────

type DealFilters = {
  status?: CrmDeal['status']
  assignee?: CrmDeal['assignee']
  product?: CrmDeal['product']
}

export function useCrmDeals(filters?: DealFilters) {
  return useQuery({
    queryKey: ['crm-deals', filters],
    queryFn: async () => {
      let query = supabase
        .from('crm_deals')
        .select('*')
        .order('value_sek', { ascending: false })
      if (filters?.status)   query = query.eq('status', filters.status)
      if (filters?.assignee) query = query.eq('assignee', filters.assignee)
      if (filters?.product)  query = query.eq('product', filters.product)
      const { data, error } = await query
      if (error) throw error
      return data as CrmDeal[]
    },
  })
}

export function useCreateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (deal: Omit<CrmDeal, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('crm_deals')
        .insert(deal)
        .select()
        .single()
      if (error) throw error
      return data as CrmDeal
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals'] }),
  })
}

export function useUpdateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmDeal> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CrmDeal
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals'] }),
  })
}

export function useDeleteDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_deals')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-deals'] }),
  })
}

// ─── Activities ───────────────────────────────────────────────────────────────

export function useCrmActivities(prospectId?: string) {
  return useQuery({
    queryKey: ['crm-activities', prospectId],
    queryFn: async () => {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('date', { ascending: false })
      if (prospectId) query = query.eq('prospect_id', prospectId)
      const { data, error } = await query
      if (error) throw error
      return data as CrmActivity[]
    },
  })
}

export function useCreateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (activity: Omit<CrmActivity, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert(activity)
        .select()
        .single()
      if (error) throw error
      return data as CrmActivity
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['crm-activities'] })
      // Also update prospect last_activity
      if (data.prospect_id) {
        supabase
          .from('crm_prospects')
          .update({ last_activity: data.date.split('T')[0] })
          .eq('id', data.prospect_id)
          .then(() => qc.invalidateQueries({ queryKey: ['crm-prospects'] }))
      }
    },
  })
}

// ─── Pipeline Stats (derived) ─────────────────────────────────────────────────

export function useCrmPipelineStats() {
  return useQuery({
    queryKey: ['crm-pipeline-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_prospects')
        .select('stage, value_sek, assignee, product')
      if (error) throw error

      const prospects = data as Pick<CrmProspect, 'stage' | 'value_sek' | 'assignee' | 'product'>[]

      const totalPipeline = prospects
        .filter(p => !['Vunnen','Förlorad'].includes(p.stage))
        .reduce((s, p) => s + p.value_sek, 0)

      const wonValue = prospects
        .filter(p => p.stage === 'Vunnen')
        .reduce((s, p) => s + p.value_sek, 0)

      const byStage = prospects.reduce<Record<string, { count: number; value: number }>>((acc, p) => {
        if (!acc[p.stage]) acc[p.stage] = { count: 0, value: 0 }
        acc[p.stage].count += 1
        acc[p.stage].value += p.value_sek
        return acc
      }, {})

      const byAssignee = prospects.reduce<Record<string, { count: number; value: number }>>((acc, p) => {
        if (!acc[p.assignee]) acc[p.assignee] = { count: 0, value: 0 }
        acc[p.assignee].count += 1
        acc[p.assignee].value += p.value_sek
        return acc
      }, {})

      return { totalPipeline, wonValue, byStage, byAssignee, totalCount: prospects.length }
    },
  })
}
