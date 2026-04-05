import { useMemo } from 'react'
import { useEntityScope } from '../scope/EntityScopeContext'
import { CORP_ENTITIES, TEAM_MEMBERS, getChildren, getMembersForEntity } from './systemData'

export function useSystemData() {
  const { activeEntity, scopedEntities } = useEntityScope()
  const isRoot = activeEntity.layer === 0

  const entities = useMemo(() =>
    isRoot
      ? CORP_ENTITIES
      : CORP_ENTITIES.filter(e =>
          scopedEntities.some(se => se.id === e.id) || e.id === activeEntity.id
        ),
  [isRoot, activeEntity.id, scopedEntities])

  const team = useMemo(() =>
    isRoot ? TEAM_MEMBERS : getMembersForEntity(activeEntity.id),
  [isRoot, activeEntity.id])

  const activeEntityFull = CORP_ENTITIES.find(e => e.id === activeEntity.id)
  const parentEntity = activeEntityFull?.parentId
    ? CORP_ENTITIES.find(e => e.id === activeEntityFull.parentId)
    : undefined
  const childEntities = getChildren(activeEntity.id)

  return {
    entities,
    team,
    activeEntityFull,
    parentEntity,
    childEntities,
    isRoot,
    allEntities: CORP_ENTITIES,
    allTeam: TEAM_MEMBERS,
  }
}
