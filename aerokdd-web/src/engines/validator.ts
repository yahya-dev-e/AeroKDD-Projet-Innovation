import type { Relation, RelationValidationStatus } from '../types/aerokdd'

export type ValidationCategory = 'VALIDATED' | 'REVIEW' | 'CANDIDATE' | 'REJECTED'

export interface RelationValidationResult {
  status: RelationValidationStatus
  category: ValidationCategory
  colorHex: string
  isAutoRelation: boolean
  isManualReviewFlagged: boolean
}

export interface ValidationBatchCounts {
  total: number
  validated: number
  review: number
  candidate: number
  rejected: number
  autoRelations: number
  inversePairs: number
  exactDuplicates: number
}

export interface ValidationBatchResult {
  relations: Relation[]
  counts: ValidationBatchCounts
  autoRelationIds: string[]
  inversePairIds: Array<[string, string]>
  duplicateIds: string[]
}

const REVIEW_KEYWORDS = ['paire inverse', 'doublon', 'e4', 'verifier', 'vérifier'] as const

/**
 * Exact port of `TrierStatutsValidationRelations` from `mod_Admin_TriRelations`.
 *
 * Rules (in exact VBA order):
 * 1. If current status contains "rejet" (case-insensitive) -> preserve Rejeté
 * 2. Else if sourceId == targetId (case-insensitive) -> "A verifier (Auto-relation)"
 * 3. Else if notes contain "paire inverse", "doublon", "e4", "verifier", or "vérifier"
 *    -> "A verifier (Revue manuelle)"
 * 4. Else if justification.length > 10 && equation.length > 2 && sourceRef.length > 2
 *    -> "Validé"
 * 5. Else -> "Candidat — à valider"
 */
export function validateRelation(relation: Relation): RelationValidationResult {
  const srcId = (relation.sourceId || '').trim().toUpperCase()
  const tgtId = (relation.targetId || '').trim().toUpperCase()
  const curStat = (relation.validationStatus || '').trim()

  if (curStat.toLowerCase().includes('rejet')) {
    return {
      status: curStat || 'Rejeté',
      category: 'REJECTED',
      colorHex: '#787878',
      isAutoRelation: srcId.length > 0 && srcId === tgtId,
      isManualReviewFlagged: false,
    }
  }

  const justif = (relation.justification || '').trim()
  const eqTxt = (relation.equation || '').trim()
  const refTxt = (relation.sourceRef || '').trim()
  const lowNote = (relation.notes || '').trim().toLowerCase()

  if (srcId.length > 0 && srcId === tgtId) {
    return {
      status: 'A verifier (Auto-relation)',
      category: 'REVIEW',
      colorHex: '#b45f06',
      isAutoRelation: true,
      isManualReviewFlagged: false,
    }
  }

  const flaggedInNotes = REVIEW_KEYWORDS.some((kw) => lowNote.includes(kw))
  if (flaggedInNotes) {
    return {
      status: 'A verifier (Revue manuelle)',
      category: 'REVIEW',
      colorHex: '#b45f06',
      isAutoRelation: false,
      isManualReviewFlagged: true,
    }
  }

  if (justif.length > 10 && eqTxt.length > 2 && refTxt.length > 2) {
    return {
      status: 'Validé',
      category: 'VALIDATED',
      colorHex: '#007d3c',
      isAutoRelation: false,
      isManualReviewFlagged: false,
    }
  }

  return {
    status: 'Candidat — à valider',
    category: 'CANDIDATE',
    colorHex: '#5a5a5a',
    isAutoRelation: false,
    isManualReviewFlagged: false,
  }
}

/**
 * Bulk validation + structural integrity audit (auto-relations, inverse pairs, directed duplicates).
 */
export function validateAllRelations(relations: Relation[]): ValidationBatchResult {
  const counts: ValidationBatchCounts = {
    total: relations.length,
    validated: 0,
    review: 0,
    candidate: 0,
    rejected: 0,
    autoRelations: 0,
    inversePairs: 0,
    exactDuplicates: 0,
  }

  const autoRelationIds: string[] = []
  const duplicateIds: string[] = []
  const inversePairIds: Array<[string, string]> = []

  const directedMap = new Map<string, string>()
  const seenInverseKeys = new Set<string>()

  const updated = relations.map((rel) => {
    const srcId = (rel.sourceId || '').trim().toUpperCase()
    const tgtId = (rel.targetId || '').trim().toUpperCase()
    const res = validateRelation(rel)

    if (res.isAutoRelation) {
      counts.autoRelations += 1
      autoRelationIds.push(rel.id)
    }

    if (srcId && tgtId) {
      const dirKey = `${srcId}->${tgtId}`
      if (directedMap.has(dirKey)) {
        counts.exactDuplicates += 1
        duplicateIds.push(rel.id)
      } else {
        directedMap.set(dirKey, rel.id)
      }

      if (srcId !== tgtId) {
        const revKey = `${tgtId}->${srcId}`
        const revId = directedMap.get(revKey)
        if (revId) {
          const pairKey = srcId < tgtId ? `${srcId}||${tgtId}` : `${tgtId}||${srcId}`
          if (!seenInverseKeys.has(pairKey)) {
            seenInverseKeys.add(pairKey)
            counts.inversePairs += 1
            inversePairIds.push([revId, rel.id])
          }
        }
      }
    }

    switch (res.category) {
      case 'VALIDATED':
        counts.validated += 1
        break
      case 'REVIEW':
        counts.review += 1
        break
      case 'CANDIDATE':
        counts.candidate += 1
        break
      case 'REJECTED':
        counts.rejected += 1
        break
    }

    return {
      ...rel,
      validationStatus: res.status,
    }
  })

  return {
    relations: updated,
    counts,
    autoRelationIds,
    inversePairIds,
    duplicateIds,
  }
}
