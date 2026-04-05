/**
 * org-graph/data.ts — RE-EXPORT från systemData
 * 
 * ENDA sanningskällan är: src/shared/data/systemData.ts
 * Denna fil finns kvar för bakåtkompatibilitet med komponenter
 * som importerar från './data' — men all data kommer från systemData.
 */

import {
  CORP_ENTITIES,
  TEAM_MEMBERS,
  BRAND_GROUPS,
  getChildren,
  getEntityById,
  getMembersForEntity,
  getDirectReports,
  type CorpEntity,
  type TeamMember,
  type BrandGroup,
} from '../../shared/data/systemData'

// Re-export allt
export {
  CORP_ENTITIES,
  CORP_ENTITIES as ENTITIES,     // bakåtkompatibilitet
  TEAM_MEMBERS,
  BRAND_GROUPS,
  getChildren,
  getEntityById,
  getMembersForEntity,
  getDirectReports,
  type CorpEntity,
  type TeamMember,
  type BrandGroup,
}

// Bakåtkompatibilitet — RELATIONS (tom tills vidare)
export const RELATIONS: Array<{
  id: string
  from_entity_id: string
  to_entity_id: string
  type: string
  label: string
}> = CORP_ENTITIES
  .filter(e => e.parentId)
  .map(e => ({
    id: `r-${e.id}`,
    from_entity_id: e.parentId!,
    to_entity_id: e.id,
    type: 'ownership',
    label: 'Owns 100%',
  }))

// Bakåtkompatibilitet — ROLE_MAPPINGS och RELATIONSHIPS
export interface RoleMapping {
  role: string
  entity_ids: string[]
  permissions: string[]
}

export const ROLE_MAPPINGS: RoleMapping[] = TEAM_MEMBERS.map(m => ({
  role: m.roleId,
  entity_ids: m.entityIds,
  permissions: m.roleId === 'group-ceo' ? ['read', 'write', 'admin'] :
               m.roleId === 'cto' ? ['read', 'write', 'deploy'] :
               ['read', 'write'],
}))

export const RELATIONSHIPS = RELATIONS

export function getRoleMappings(entityId: string): RoleMapping[] {
  return ROLE_MAPPINGS.filter(r => r.entity_ids.includes(entityId))
}

export function getRelationships(entityId: string) {
  return RELATIONS.filter(r => r.from_entity_id === entityId || r.to_entity_id === entityId)
}
