import React, { createContext, useContext, useState, useMemo } from 'react'
import { CORP_ENTITIES, BRAND_GROUPS, CorpEntity, BrandGroup } from '../data/systemData'

// Re-export Entity type alias for backwards compatibility
export type Entity = CorpEntity

export type ViewScope = 'group' | 'entity'

// Three-level scope
export type ScopeLevel = 'group' | 'brand' | 'entity'

interface EntityScopeContextValue {
  // ── New 3-level API ──────────────────────────────────────────────────────
  level: ScopeLevel
  brandGroup: BrandGroup | null   // set when level === 'brand'
  activeEntityId: string          // entity id OR brand-group id when level === 'brand'
  setScope: (level: ScopeLevel, entityId: string, brandGroup: BrandGroup | null) => void
  /** IDs of entities in scope based on current level */
  scopedEntityIds: string[]

  // ── Legacy API (backward compat) ─────────────────────────────────────────
  activeEntity: CorpEntity
  setActiveEntity: (e: CorpEntity) => void
  isInScope: (entityId: string) => boolean
  scopedEntities: CorpEntity[]
  viewScope: ViewScope
  setViewScope: (scope: ViewScope) => void
}

// Build subtree: entity + all its descendants (recursive via parentId / parent_entity_id)
function getSubtree(root: CorpEntity, all: CorpEntity[]): CorpEntity[] {
  const result: CorpEntity[] = [root]
  const children = all.filter(e => e.parentId === root.id)
  for (const child of children) {
    result.push(...getSubtree(child, all))
  }
  return result
}

const EntityScopeContext = createContext<EntityScopeContextValue | null>(null)

export function EntityScopeProvider({ children }: { children: React.ReactNode }) {
  // Default: Wavult Group level (aggregate all)
  const [level, setLevel] = useState<ScopeLevel>('group')
  const [activeEntityId, setActiveEntityId] = useState<string>('wavult-group')
  const [brandGroup, setBrandGroup] = useState<BrandGroup | null>(null)
  const [viewScope, setViewScope] = useState<ViewScope>('entity')

  // Derive the "active entity" for legacy consumers
  const defaultEntity = CORP_ENTITIES.find(e => e.layer === 0) ?? CORP_ENTITIES[0]
  const activeEntity: CorpEntity = useMemo(() => {
    if (level === 'entity') {
      return CORP_ENTITIES.find(e => e.id === activeEntityId) ?? defaultEntity
    }
    // group or brand → return root holding for legacy consumers
    return defaultEntity
  }, [level, activeEntityId, defaultEntity])

  const setActiveEntity = (e: CorpEntity) => {
    setScope('entity', e.id, null)
  }

  function setScope(newLevel: ScopeLevel, entityId: string, newBrandGroup: BrandGroup | null) {
    setLevel(newLevel)
    setActiveEntityId(entityId)
    setBrandGroup(newBrandGroup)
  }

  const scopedEntityIds = useMemo(() => {
    if (level === 'group') return CORP_ENTITIES.map(e => e.id)
    if (level === 'brand' && brandGroup) return brandGroup.entityIds
    return [activeEntityId]
  }, [level, activeEntityId, brandGroup])

  // Legacy: scoped entities (full objects)
  const scopedEntities = useMemo(() => {
    if (level === 'group') return CORP_ENTITIES
    if (level === 'brand' && brandGroup) {
      return CORP_ENTITIES.filter(e => brandGroup.entityIds.includes(e.id))
    }
    const found = CORP_ENTITIES.find(e => e.id === activeEntityId)
    return found ? getSubtree(found, CORP_ENTITIES) : [defaultEntity]
  }, [level, activeEntityId, brandGroup, defaultEntity])

  const scopedIds = useMemo(() => new Set(scopedEntities.map(e => e.id)), [scopedEntities])
  const isInScope = (entityId: string) => scopedIds.has(entityId)

  return (
    <EntityScopeContext.Provider value={{
      level,
      brandGroup,
      activeEntityId,
      setScope,
      scopedEntityIds,
      // legacy
      activeEntity,
      setActiveEntity,
      isInScope,
      scopedEntities,
      viewScope,
      setViewScope,
    }}>
      {children}
    </EntityScopeContext.Provider>
  )
}

export function useEntityScope() {
  const ctx = useContext(EntityScopeContext)
  if (!ctx) throw new Error('useEntityScope must be used inside EntityScopeProvider')
  return ctx
}
