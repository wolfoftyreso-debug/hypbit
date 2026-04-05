import React, { createContext, useContext, useState } from 'react'
import { CORP_ENTITIES, CorpEntity } from '../data/systemData'

// Re-export Entity type alias for backwards compatibility
export type Entity = CorpEntity

export type ViewScope = 'group' | 'entity'

interface EntityScopeContextValue {
  activeEntity: CorpEntity
  setActiveEntity: (e: CorpEntity) => void
  // Returns true if the given entity_id is "in scope" for the active entity
  // Logic: active entity is root (layer 0) → everything is in scope
  // active entity layer 1+ → only entities in its subtree are in scope
  isInScope: (entityId: string) => boolean
  // All entities that are in scope
  scopedEntities: CorpEntity[]
  // View scope: 'group' = aggregate all entities, 'entity' = filter to activeEntity only
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
  // Default: root holding (wgh)
  const defaultEntity = CORP_ENTITIES.find(e => e.layer === 0) ?? CORP_ENTITIES[0]
  const [activeEntity, setActiveEntity] = useState<CorpEntity>(defaultEntity)
  const [viewScope, setViewScope] = useState<ViewScope>('entity')

  const scopedEntities = getSubtree(activeEntity, CORP_ENTITIES)
  const scopedIds = new Set(scopedEntities.map(e => e.id))
  const isInScope = (entityId: string) => scopedIds.has(entityId)

  return (
    <EntityScopeContext.Provider value={{ activeEntity, setActiveEntity, scopedEntities, isInScope, viewScope, setViewScope }}>
      {children}
    </EntityScopeContext.Provider>
  )
}

export function useEntityScope() {
  const ctx = useContext(EntityScopeContext)
  if (!ctx) throw new Error('useEntityScope must be used inside EntityScopeProvider')
  return ctx
}
