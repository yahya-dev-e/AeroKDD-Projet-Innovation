import type {
  GraphLinkKind,
  KDD,
  Relation,
  RelationStatusBucket,
  ShortNodeCategory,
  SubsystemCode,
} from '../types/aerokdd'
import { extractFamilyNumber } from './classifier'

export const AKDD_NODE_W = 54
export const AKDD_NODE_H = 24
export const AKDD_RING_GAP = 75

export const SUBSYSTEM_PRIORITY: readonly SubsystemCode[] = [
  'FAN',
  'BOOSTER',
  'HPC',
  'COMB',
  'HPT',
  'LPT',
  'NOZZLE',
  'COOLING',
  'ELECTRICAL',
  'OIL',
]

export const SUBSYSTEM_FILL_HEX: Record<string, string> = {
  FAN: '#d9eaf7',
  BOOSTER: '#e2efda',
  HPC: '#fff2cc',
  COMB: '#fce5cd',
  HPT: '#ead1dc',
  LPT: '#d9d2e9',
  NOZZLE: '#d0e0e3',
  COOLING: '#ffe6e6',
  ELECTRICAL: '#cfe2f3',
  OIL: '#e6e6e6',
}

export interface GraphNodeColors {
  fillHex: string
  textHex: string
  borderHex: string
  borderWidth: number
}

export interface GlobalGraphNode {
  id: string
  kdd: KDD
  subsystemCode: string
  category: ShortNodeCategory
  x: number
  y: number
  colors: GraphNodeColors
}

export interface GlobalGraphEdge {
  id: string
  relation: Relation
  sourceId: string
  targetId: string
  kind: GraphLinkKind
  statusBucket: RelationStatusBucket
  isSelfLoop: boolean
  isDashed: boolean
  colorHex: string
  lineWidth: number
}

export interface SubsystemCluster {
  subsystemCode: string
  count: number
  ringCount: number
  centerX: number
  centerY: number
  localRadius: number
  labelX: number
  labelY: number
}

export interface GlobalGraphMetrics {
  nodeCount: number
  leverNodeCount: number
  prestNodeCount: number
  otherNodeCount: number
  drawnRelations: number
  topDownRelations: number
  couplingRelations: number
  contextRelations: number
  invalidRelations: number
}

export interface GlobalGraphResult {
  filterSubsystem: string | null
  nodes: GlobalGraphNode[]
  edges: GlobalGraphEdge[]
  clusters: SubsystemCluster[]
  metrics: GlobalGraphMetrics
}

export interface EgoRelationItem {
  direction: 'ENTRANT' | 'SORTANT'
  arrow: '←' | '→'
  relation: Relation
  sourceCategory: ShortNodeCategory
  targetCategory: ShortNodeCategory
  roleLabel: string
  roleColorHex: string
}

export interface KddEgoGraphResult {
  selectedKdd: KDD | null
  selectedCategory: ShortNodeCategory
  incoming: EgoRelationItem[]
  outgoing: EgoRelationItem[]
  allLinks: EgoRelationItem[]
}

/**
 * Exact port of `AKDD_NormalizeSubsystem` from `mod_GrapheGlobal`.
 */
export function normalizeSubsystemCode(rawCode: string, rawName = ''): string {
  let s = (rawCode || '').trim().toUpperCase()
  if (!s) s = (rawName || '').trim().toUpperCase()

  if (s.includes('FAN') || s.includes('SOUFFL')) return 'FAN'
  if (s.includes('BOOSTER') || s === 'CBP' || s === 'LPC') return 'BOOSTER'
  if (s.includes('HPC') || s === 'CHP') return 'HPC'
  if (s.includes('COMB') || s === 'CC' || s.includes('CHAMBRE')) return 'COMB'
  if (s.includes('HPT')) return 'HPT'
  if (s.includes('LPT')) return 'LPT'
  if (s.includes('NOZZ') || s.includes('TUY')) return 'NOZZLE'
  if (s.includes('COOL') || s.includes('REFROID')) return 'COOLING'
  if (s.includes('LECTR') || s === 'ELEC') return 'ELECTRICAL'
  if (s.includes('OIL') || s.includes('LUB') || s.includes('HUIL')) return 'OIL'
  if ((rawCode || '').trim()) return (rawCode || '').trim().toUpperCase()
  if ((rawName || '').trim()) return (rawName || '').trim().toUpperCase()
  return 'NON CLASSE'
}

/**
 * Exact port of `AKDD_CanonicalKey`.
 */
export function canonicalKeyGlobal(idTxt: string): string {
  const clean = (idTxt || '').trim()
  const dashIdx = clean.indexOf('-')
  if (dashIdx === -1) return ''
  const p = normalizeSubsystemCode(clean.slice(0, dashIdx))
  const n = Number.parseInt(clean.slice(dashIdx + 1), 10)
  return Number.isFinite(n) && n > 0 ? `${p}|${n}` : ''
}

export function isLeverCategory(cat: ShortNodeCategory): boolean {
  return cat === 'KDD' || cat === 'S' || cat === 'D'
}

export function isPrestationCategory(cat: ShortNodeCategory): boolean {
  return cat === 'PRESTATION'
}

/**
 * Exact port of `AKDD_StatutToShortCat` from `mod_GrapheGlobal`.
 */
export function statutToShortCat(kdd: KDD): ShortNodeCategory {
  const s = (kdd.statutKdd || '').trim().toUpperCase()
  if (s.length > 0) {
    if (s.startsWith('KDD')) return 'KDD'
    if (s.startsWith('S -') || s.startsWith('S ')) return 'S'
    if (s.startsWith('D -') || s.startsWith('D ')) return 'D'
    if (s.includes('PRESTATION') || s.includes('EFFET INDUIT') || s.includes('PERFO')) {
      return 'PRESTATION'
    }
    if (s.includes('INPUT') || s.includes('INTERFACE')) return 'INPUT'
    if (s.includes('CONTRAINT') || s.includes('RAMS') || s.includes('STRATEG')) {
      return 'CONTRAINTE'
    }
  }

  const shName = (kdd.specSheet || kdd.subsystemCode || '').trim().toUpperCase()
  const n = (kdd.name || '').trim().toUpperCase()
  const t = (kdd.type || '').trim().toUpperCase()
  const ksdVal = (kdd.classification || '').trim().toUpperCase()
  const famNum = extractFamilyNumber(kdd.family)

  if (shName.includes('FAN') && n.includes('PRESSURE RATIO')) return 'KDD'
  if (
    n.includes('ROBUSTNESS STRATEGY') ||
    (n.includes('THERMAL GROWTH') && n.includes('CREEP')) ||
    n.includes('SAFETY') ||
    n.includes('HED') ||
    n.includes('BURST PROTECTION')
  ) {
    return 'CONTRAINTE'
  }

  if (t.includes('SOLUTION') || t.includes('PARAM')) {
    if (ksdVal === 'K') return 'KDD'
    if (ksdVal === 'S' || (ksdVal === '' && famNum === 4)) return 'S'
    return 'D'
  }
  if (t.includes('CONSTRAINT') || t.includes('CONTRAINT')) return 'CONTRAINTE'
  if (t.includes('INPUT') || t.includes('ENVT') || t.includes('INTERFACE')) return 'INPUT'
  if (t.includes('INDUCED') || t.includes('ATTENTE') || t.includes('PERFO')) return 'PRESTATION'
  return 'AUTRE'
}

/**
 * Exact port of `AKDD_ClassifyLinkKind`.
 */
export function classifyLinkKind(
  srcCat: ShortNodeCategory,
  tgtCat: ShortNodeCategory,
): { kind: GraphLinkKind; colorHex: string; lineWidth: number } {
  if (
    (isLeverCategory(srcCat) && isPrestationCategory(tgtCat)) ||
    (isPrestationCategory(srcCat) && isLeverCategory(tgtCat))
  ) {
    return { kind: 'TOP_DOWN', colorHex: '#00914b', lineWidth: 1 }
  }
  if (isLeverCategory(srcCat) && isLeverCategory(tgtCat)) {
    return { kind: 'COUPLAGE', colorHex: '#e67e22', lineWidth: 0.75 }
  }
  return { kind: 'CONTEXTE', colorHex: '#919191', lineWidth: 0.55 }
}

/**
 * Exact port of `AKDD_StatusCategory`.
 */
export function getRelationStatusBucket(statusText: string): RelationStatusBucket {
  const s = (statusText || '').trim().toLowerCase()
  if (s.includes('rejet')) return 'REJECTED'
  if (
    s.includes('candidat') ||
    s.includes('valider') ||
    s.includes('non valid') ||
    s.includes('en revue')
  ) {
    return 'CANDIDATE'
  }
  if (s.includes('valid')) return 'VALIDATED'
  return 'CANDIDATE'
}

/**
 * Exact port of `AKDD_GetNodeColors`.
 */
export function getNodeColors(cat: ShortNodeCategory, subsystemCode: string): GraphNodeColors {
  switch (cat) {
    case 'KDD':
      return { fillHex: '#d9ead3', textHex: '#19410f', borderHex: '#38761d', borderWidth: 1.15 }
    case 'S':
      return { fillHex: '#cfe2f3', textHex: '#0b5394', borderHex: '#3d85c6', borderWidth: 0.9 }
    case 'D':
      return { fillHex: '#eaf2f8', textHex: '#244062', borderHex: '#789bbe', borderWidth: 0.75 }
    case 'PRESTATION':
      return { fillHex: '#fff2cc', textHex: '#7f6000', borderHex: '#bf9000', borderWidth: 0.9 }
    case 'INPUT':
      return { fillHex: '#eeeeee', textHex: '#434343', borderHex: '#8c8c8c', borderWidth: 0.75 }
    case 'CONTRAINTE':
      return { fillHex: '#f4cccc', textHex: '#990000', borderHex: '#cc4125', borderWidth: 0.75 }
    default:
      return {
        fillHex: SUBSYSTEM_FILL_HEX[subsystemCode.toUpperCase()] ?? '#f2f2f2',
        textHex: '#232323',
        borderHex: '#5f5f5f',
        borderWidth: 0.75,
      }
  }
}

/**
 * Exact port of `RelStatusText` from `mod_GraphKDD_Schema`.
 */
export function getRelStatusText(
  srcCat: ShortNodeCategory,
  tgtCat: ShortNodeCategory,
  rawStatus: string,
): { label: string; colorHex: string } {
  if ((rawStatus || '').toLowerCase().includes('rejet')) {
    return { label: 'Rejete', colorHex: '#787878' }
  }
  const sL = isLeverCategory(srcCat)
  const tL = isLeverCategory(tgtCat)

  if ((sL && tgtCat === 'PRESTATION') || (srcCat === 'PRESTATION' && tL)) {
    return { label: 'Top-Down (Levier <-> Prest.)', colorHex: '#007d3c' }
  }
  if (sL && tL) {
    return { label: 'Couplage (Levier <-> Levier)', colorHex: '#cc6600' }
  }
  if (srcCat === 'CONTRAINTE' || tgtCat === 'CONTRAINTE') {
    return { label: 'Contrainte / RAMS', colorHex: '#990000' }
  }
  if (srcCat === 'INPUT' || tgtCat === 'INPUT') {
    return { label: 'Input / Interface', colorHex: '#5a5a5a' }
  }
  if (srcCat === 'PRESTATION' && tgtCat === 'PRESTATION') {
    return { label: 'Interaction Prestations', colorHex: '#7f6000' }
  }
  return { label: rawStatus, colorHex: '#3c3c3c' }
}

/**
 * Exact port of `AKDD_GenererGrapheAvecFiltre` circular 10-subsystem layout
 * and edge/node classification from `mod_GrapheGlobal`.
 */
export function buildGlobalGraph(
  kdds: KDD[],
  relations: Relation[],
  filterSubsystem?: string | null,
): GlobalGraphResult {
  const normalizedFilter = filterSubsystem?.trim()
    ? normalizeSubsystemCode(filterSubsystem)
    : null

  const baseIds = new Set<string>()
  const idToNodeIdx = new Map<string, number>()
  const systemBuckets = new Map<string, number[]>()

  const rawNodes: Array<{
    id: string
    kdd: KDD
    subsystemCode: string
    category: ShortNodeCategory
    x: number
    y: number
    colors: GraphNodeColors
  }> = []

  let leverNodeCount = 0
  let prestNodeCount = 0
  let otherNodeCount = 0

  for (const kdd of kdds) {
    const cleanId = (kdd.id || '').trim().toUpperCase()
    if (!cleanId) continue

    const sysCode = normalizeSubsystemCode(kdd.subsystemCode, kdd.subsystemLabel)
    baseIds.add(cleanId)

    if (!normalizedFilter || sysCode === normalizedFilter) {
      if (!idToNodeIdx.has(cleanId)) {
        const cat = statutToShortCat(kdd)
        const idx = rawNodes.length
        rawNodes.push({
          id: cleanId,
          kdd,
          subsystemCode: sysCode,
          category: cat,
          x: 0,
          y: 0,
          colors: getNodeColors(cat, sysCode),
        })
        idToNodeIdx.set(cleanId, idx)

        if (isLeverCategory(cat)) leverNodeCount += 1
        else if (isPrestationCategory(cat)) prestNodeCount += 1
        else otherNodeCount += 1

        const bucket = systemBuckets.get(sysCode)
        if (bucket) bucket.push(idx)
        else systemBuckets.set(sysCode, [idx])
      }
    }
  }

  // Order subsystems in exact VBA priority order
  const systemOrder: string[] = []
  const usedSystems = new Set<string>()
  for (const code of SUBSYSTEM_PRIORITY) {
    if (systemBuckets.has(code)) {
      systemOrder.push(code)
      usedSystems.add(code)
    }
  }
  for (const code of systemBuckets.keys()) {
    if (!usedSystems.has(code)) {
      systemOrder.push(code)
      usedSystems.add(code)
    }
  }

  // Compute concentric ring counts per subsystem
  const systemsCount = systemOrder.length
  const systemRingCounts = new Map<string, number>()
  let maxRing = 1

  for (const code of systemOrder) {
    const bucket = systemBuckets.get(code)!
    let ring = 1
    let ringCapacity = 8
    while (ringCapacity < bucket.length) {
      ring += 1
      ringCapacity = ring * (ring + 1) * 4
    }
    systemRingCounts.set(code, ring)
    if (ring > maxRing) maxRing = ring
  }

  const maxLocalRadius = AKDD_RING_GAP * maxRing
  const globalRadius =
    systemsCount <= 1
      ? 0
      : (2 * maxLocalRadius + AKDD_NODE_W + 130) / (2 * Math.sin(Math.PI / systemsCount))

  const offsetX = globalRadius + maxLocalRadius + AKDD_NODE_W / 2 + 10
  const offsetY = globalRadius + maxLocalRadius + AKDD_NODE_H / 2 + 34

  const clusters: SubsystemCluster[] = []

  systemOrder.forEach((code, i) => {
    const systemsIndex = i + 1 // 1-based to match VBA angle phase offset
    const bucket = systemBuckets.get(code)!
    const sysAngle = systemsCount <= 1 ? 0 : -Math.PI / 2 + (2 * Math.PI * i) / systemsCount
    const centerX = offsetX + globalRadius * Math.cos(sysAngle)
    const centerY = offsetY + globalRadius * Math.sin(sysAngle)

    let posInBucket = 0
    let ring = 1
    while (posInBucket < bucket.length) {
      const remaining = bucket.length - posInBucket
      const ringCount = Math.min(remaining, 8 * ring)
      const localRadius = AKDD_RING_GAP * ring

      for (let j = 0; j < ringCount; j++) {
        const nodeIdx = bucket[posInBucket]
        const nodeAngle = (2 * Math.PI * j) / ringCount + systemsIndex * 0.17
        rawNodes[nodeIdx].x = centerX + localRadius * Math.cos(nodeAngle)
        rawNodes[nodeIdx].y = centerY + localRadius * Math.sin(nodeAngle)
        posInBucket += 1
      }
      ring += 1
    }

    const totalRings = systemRingCounts.get(code) ?? 1
    const clusterRadius = AKDD_RING_GAP * totalRings
    clusters.push({
      subsystemCode: code,
      count: bucket.length,
      ringCount: totalRings,
      centerX,
      centerY,
      localRadius: clusterRadius,
      labelX: centerX,
      labelY: centerY - clusterRadius - AKDD_NODE_H / 2 - 28,
    })
  })

  // Classify edges
  const edges: GlobalGraphEdge[] = []
  let invalidRelations = 0
  let topDownRelations = 0
  let couplingRelations = 0
  let contextRelations = 0

  for (const rel of relations) {
    const srcId = (rel.sourceId || '').trim().toUpperCase()
    const tgtId = (rel.targetId || '').trim().toUpperCase()
    if (!srcId || !tgtId) continue

    if (!baseIds.has(srcId) || !baseIds.has(tgtId)) {
      invalidRelations += 1
      continue
    }

    const srcIdx = idToNodeIdx.get(srcId)
    const tgtIdx = idToNodeIdx.get(tgtId)
    if (srcIdx === undefined || tgtIdx === undefined) continue

    const statusBucket = getRelationStatusBucket(rel.validationStatus)
    const linkStyle = classifyLinkKind(rawNodes[srcIdx].category, rawNodes[tgtIdx].category)

    if (linkStyle.kind === 'TOP_DOWN') topDownRelations += 1
    else if (linkStyle.kind === 'COUPLAGE') couplingRelations += 1
    else contextRelations += 1

    edges.push({
      id: rel.id,
      relation: rel,
      sourceId: srcId,
      targetId: tgtId,
      kind: linkStyle.kind,
      statusBucket,
      isSelfLoop: srcIdx === tgtIdx,
      isDashed: statusBucket === 'REJECTED',
      colorHex: linkStyle.colorHex,
      lineWidth: linkStyle.lineWidth,
    })
  }

  return {
    filterSubsystem: normalizedFilter,
    nodes: rawNodes,
    edges,
    clusters,
    metrics: {
      nodeCount: rawNodes.length,
      leverNodeCount,
      prestNodeCount,
      otherNodeCount,
      drawnRelations: edges.length,
      topDownRelations,
      couplingRelations,
      contextRelations,
      invalidRelations,
    },
  }
}

/**
 * Exact port of `CollectRels` from `mod_GraphKDD_Schema` for unit KDD exploration.
 */
export function buildKddEgoGraph(
  kdds: KDD[],
  relations: Relation[],
  selectedKddId: string,
): KddEgoGraphResult {
  const targetId = (selectedKddId || '').trim().toUpperCase()
  const kddById = new Map<string, KDD>()
  const catByCanon = new Map<string, ShortNodeCategory>()

  for (const kdd of kdds) {
    const up = (kdd.id || '').trim().toUpperCase()
    kddById.set(up, kdd)
    const ck = canonicalKeyGlobal(up)
    if (ck) catByCanon.set(ck, statutToShortCat(kdd))
  }

  const selectedKdd = kddById.get(targetId) ?? null
  const selectedCategory: ShortNodeCategory = selectedKdd ? statutToShortCat(selectedKdd) : 'AUTRE'

  const incoming: EgoRelationItem[] = []
  const outgoing: EgoRelationItem[] = []
  const allLinks: EgoRelationItem[] = []

  if (!targetId) {
    return { selectedKdd, selectedCategory, incoming, outgoing, allLinks }
  }

  for (const rel of relations) {
    const sId = (rel.sourceId || '').trim().toUpperCase()
    const tId = (rel.targetId || '').trim().toUpperCase()
    if (!sId || !tId) continue
    if (sId !== targetId && tId !== targetId) continue

    const sCat = catByCanon.get(canonicalKeyGlobal(sId)) ?? 'AUTRE'
    const tCat = catByCanon.get(canonicalKeyGlobal(tId)) ?? 'AUTRE'
    const role = getRelStatusText(sCat, tCat, rel.validationStatus)

    if (sId === targetId) {
      const item: EgoRelationItem = {
        direction: 'SORTANT',
        arrow: '→',
        relation: rel,
        sourceCategory: sCat,
        targetCategory: tCat,
        roleLabel: role.label,
        roleColorHex: role.colorHex,
      }
      allLinks.push(item)
      outgoing.push(item)
    } else {
      const item: EgoRelationItem = {
        direction: 'ENTRANT',
        arrow: '←',
        relation: rel,
        sourceCategory: sCat,
        targetCategory: tCat,
        roleLabel: role.label,
        roleColorHex: role.colorHex,
      }
      allLinks.push(item)
      incoming.push(item)
    }
  }

  return { selectedKdd, selectedCategory, incoming, outgoing, allLinks }
}
