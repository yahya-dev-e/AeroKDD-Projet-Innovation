import type { KDD, Relation } from '../types/aerokdd'

export const TOP_DOWN_THEMES = [
  'TOUTES LES PRESTATIONS',
  'Bruit / Acoustique',
  'Poussee / Debit',
  'Rendement / Consommation',
  'Masse / Encombrement',
  'Emissions (NOx / CO)',
  'Stabilite / Pompage',
  'Thermique / Duree de vie',
  'Securite / Chocs / Burst',
  'Cout / Maintenance',
] as const

export type TopDownTheme = (typeof TOP_DOWN_THEMES)[number] | (string & {})

export type CentralityLevel = 'CARREFOUR' | 'FORT' | 'CIBLE'

export interface CentralityBadge {
  level: CentralityLevel
  degree: number
  label: string
}

export interface SideEffectItem {
  kddId: string
  kddName: string
}

export interface TopDownRow {
  prestationId: string
  prestationName: string
  prestationLabel: string
  prestationSubsystem: string
  leverSubsystem: string
  leverId: string
  leverName: string
  level: 1 | 2
  isInterSystem: boolean
  relayId?: string
  directionText: string
  degree: number
  badge: CentralityBadge
  sideEffects: SideEffectItem[]
  sideEffectsText: string
  justification: string
}

export interface SubsystemTopDownSummary {
  subsystem: string
  directCount: number
  indirectCount: number
  totalCount: number
}

export interface TopDownVisuLever {
  subsystem: string
  leverId: string
  leverName: string
  badge: CentralityBadge
  isDirect: boolean
}

export interface TopDownAnalysisResult {
  theme: string
  totalRelationsAnalyzed: number
  matchedPrestationsCount: number
  directCount: number
  indirectCount: number
  touchedSubsystemsCount: number
  rows: TopDownRow[]
  subsystemSummary: SubsystemTopDownSummary[]
  visuLevers: TopDownVisuLever[]
}

function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Exact port of `PrefixeStdTD` from `mod_AnalyseTopDown`.
 */
export function normalizeSubsystemPrefixTD(nomSys: string): string {
  const s = (nomSys || '').trim().toUpperCase()
  if (s.includes('FAN')) return 'FAN'
  if (s.includes('BOOST') || s.includes('CBP') || s.includes('LPC')) return 'LPC'
  if (s.includes('HPC') || s.includes('CHP')) return 'HPC'
  if (s.includes('COMB') || s === 'CC' || s.includes('CHAMBRE')) return 'COMB'
  if (s.includes('HPT')) return 'HPT'
  if (s.includes('LPT')) return 'LPT'
  if (s.includes('NOZZ') || s.includes('TUY')) return 'NOZZLE'
  if (s.includes('COOL') || s.includes('REFROID')) return 'COOLING'
  if (s.includes('ELEC')) return 'ELECTRICAL'
  if (s.includes('LUBE') || s.includes('OIL') || s.includes('HUIL')) return 'LUBE'
  return s
}

/**
 * Exact port of `CleCanonTD` from `mod_AnalyseTopDown`.
 */
export function canonicalKeyTD(idTxt: string): string {
  const clean = (idTxt || '').trim()
  const dashIdx = clean.indexOf('-')
  if (dashIdx === -1) return ''
  const prefix = normalizeSubsystemPrefixTD(clean.slice(0, dashIdx))
  const num = Number.parseInt(clean.slice(dashIdx + 1), 10)
  if (!Number.isFinite(num) || num <= 0) return ''
  return `${prefix}|${num}`
}

/**
 * Exact port of `EstUnLevierPhysique`.
 */
export function estUnLevierPhysique(typeVal: string): boolean {
  const t = (typeVal || '').toUpperCase()
  return t.includes('SOLUTION') || t.includes('PARAM')
}

/**
 * Exact port of `EstUnePrestation`.
 */
export function estUnePrestation(typeVal: string): boolean {
  const t = (typeVal || '').toUpperCase()
  return (
    t.includes('ATTENTE') ||
    t.includes('PERFO') ||
    t.includes('INDUCED') ||
    t.includes('CONSTRAINT')
  )
}

function contientMot(texte: string, ...mots: string[]): boolean {
  const upper = texte.toUpperCase()
  return mots.some((m) => upper.includes(m.toUpperCase()))
}

/**
 * Exact port of `MatchCategorie` from `mod_AnalyseTopDown` (10 themes).
 * Accent-insensitive on `choix` so both accented French labels (e.g. "Poussée / Débit")
 * and unaccented VBA dropdown values ("Poussee / Debit") match identically.
 */
export function matchCategorie(choix: string, nomKdd: string): boolean {
  const normalizedChoice = stripDiacritics((choix || '').trim())
  const n = (nomKdd || '').toUpperCase()
  if (!normalizedChoice || normalizedChoice.toUpperCase() === 'TOUTES LES PRESTATIONS') {
    return true
  }

  switch (normalizedChoice) {
    case 'Bruit / Acoustique':
      return contientMot(n, 'ACOUST', 'NOISE', 'BRUIT')
    case 'Poussee / Debit':
      return contientMot(
        n,
        'THRUST',
        'POUSS',
        'FLOW',
        'DEBIT',
        'PRESSURE RATIO',
        'OPR',
        'EXPANSION',
        'POWER OUTPUT',
        'TORQUE',
      )
    case 'Rendement / Consommation':
      return contientMot(
        n,
        'EFFICIEN',
        'RENDEMENT',
        'LOSS',
        'PERTE',
        'CONSUMPTION',
        'PENALTY',
        'LEAKAGE',
        'CYCLE',
        'TSFC',
      )
    case 'Masse / Encombrement':
      return contientMot(n, 'WEIGHT', 'MASS', 'ENVELOPE', 'LENGTH', 'DIAMETER', 'VOLUME')
    case 'Emissions (NOx / CO)':
      return contientMot(n, 'NOX', 'EMISSION', 'SMOKE', 'SOOT', 'NVPM', 'UNBURNED', 'MIST', 'VENT')
    case 'Stabilite / Pompage':
      return contientMot(
        n,
        'SURGE',
        'STALL',
        'STABILIT',
        'BLOWOUT',
        'IGNITION',
        'RELIGHT',
        'MATCHING',
        'BACKPRESSURE',
        'TRANSIENT',
      )
    case 'Thermique / Duree de vie':
      return contientMot(
        n,
        'THERMAL',
        'TEMP',
        'CREEP',
        'DURABILIT',
        'LIFE',
        'COOLING',
        'HEAT',
        'PATTERN',
        'T3',
        'T4',
        'GRADIENT',
      )
    case 'Securite / Chocs / Burst':
      return contientMot(
        n,
        'SAFETY',
        'BURST',
        'HED',
        'DAMAGE',
        'FIRE',
        'CONTAIN',
        'EIGEN',
        'VIBRAT',
        'FAULT',
        'BIRD',
        'FOD',
        'ICE',
      )
    case 'Cout / Maintenance':
      return contientMot(
        n,
        'COST',
        'DMC',
        'LCC',
        'MAINT',
        'REPAIR',
        'ACCESS',
        'LRU',
        'CERTIF',
        'TRANSPORT',
      )
    default:
      return true
  }
}

/**
 * Exact port of `FormaterBadge`.
 */
export function formaterBadge(deg: number): CentralityBadge {
  if (deg >= 8) {
    return { level: 'CARREFOUR', degree: deg, label: `CARREFOUR (${deg} liens)` }
  }
  if (deg >= 4) {
    return { level: 'FORT', degree: deg, label: `FORT (${deg} liens)` }
  }
  return { level: 'CIBLE', degree: deg, label: `CIBLE (${deg} liens)` }
}

/**
 * Exact port of `EstAvant` comparator from `mod_AnalyseTopDown`.
 * Returns true if row `a` should appear before row `b`:
 * 1. Level ascending (Direct Niv 1 before Indirect Niv 2)
 * 2. For Level 2, Inter-system (1) before Intra-system (0)
 * 3. Degree descending (CARREFOUR > FORT > CIBLE)
 * 4. Prestation label ascending (lexicographical `<`)
 */
export function estAvant(
  a: Pick<TopDownRow, 'level' | 'isInterSystem' | 'degree' | 'prestationLabel'>,
  b: Pick<TopDownRow, 'level' | 'isInterSystem' | 'degree' | 'prestationLabel'>,
): boolean {
  if (a.level !== b.level) return a.level < b.level
  if (a.level === 2 && a.isInterSystem !== b.isInterSystem) {
    return a.isInterSystem && !b.isInterSystem
  }
  if (a.degree !== b.degree) return a.degree > b.degree
  return a.prestationLabel < b.prestationLabel
}

interface NormalizedRel {
  cSrc: string
  srcId: string
  srcName: string
  cCib: string
  cibId: string
  cibName: string
  nature: string
  justification: string
}

/**
 * Exact port of `CalculerEffetsDeBordFast` from `mod_AnalyseTopDown`.
 */
export function calculerEffetsDeBordFast(
  cleLev: string,
  clePrestExclue: string,
  adj: Map<string, number[]>,
  rels: NormalizedRel[],
  dictNom: Map<string, string>,
  dictIdAff: Map<string, string>,
): { items: SideEffectItem[]; formatted: string } {
  const incident = adj.get(cleLev)
  if (!incident || incident.length === 0) {
    return {
      items: [],
      formatted: 'Aucun effet de bord enregistre dans le modele.',
    }
  }

  const seen = new Set<string>()
  const items: SideEffectItem[] = []
  const lines: string[] = []

  for (const k of incident) {
    const rel = rels[k]
    let autreCle = ''
    let autreId = ''
    let autreNom = ''

    if (rel.cSrc === cleLev && rel.cCib !== clePrestExclue && rel.cCib !== cleLev) {
      autreCle = rel.cCib
      autreId = dictIdAff.get(autreCle) ?? rel.cibId
      autreNom = dictNom.get(autreCle) ?? rel.cibName
    } else if (rel.cCib === cleLev && rel.cSrc !== clePrestExclue && rel.cSrc !== cleLev) {
      autreCle = rel.cSrc
      autreId = dictIdAff.get(autreCle) ?? rel.srcId
      autreNom = dictNom.get(autreCle) ?? rel.srcName
    }

    if (autreCle && !seen.has(autreCle)) {
      seen.add(autreCle)
      items.push({ kddId: autreId, kddName: autreNom })
      lines.push(`${items.length}) ${autreId} - ${autreNom}`)
    }
  }

  if (items.length === 0) {
    return {
      items: [],
      formatted: 'Aucun effet de bord enregistre dans le modele.',
    }
  }

  return {
    items,
    formatted: lines.join('\n'),
  }
}

/**
 * Exact port of `ActualiserTopDownDynamique` + `GenererVisuTopDown` aggregation
 * from `mod_AnalyseTopDown`.
 */
export function runTopDownAnalysis(
  kdds: KDD[],
  relations: Relation[],
  theme: TopDownTheme = 'TOUTES LES PRESTATIONS',
): TopDownAnalysisResult {
  const choix = (theme || '').trim() || 'TOUTES LES PRESTATIONS'
  const isAllThemes = stripDiacritics(choix).toUpperCase() === 'TOUTES LES PRESTATIONS'

  // 1. Index KDDs by canonical key (mirroring SPEC-* scan)
  const dictNom = new Map<string, string>()
  const dictType = new Map<string, string>()
  const dictSys = new Map<string, string>()
  const dictIdAff = new Map<string, string>()

  for (const kdd of kdds) {
    const cle = canonicalKeyTD(kdd.id)
    if (!cle || dictNom.has(cle)) continue
    dictNom.set(cle, kdd.name)
    dictType.set(cle, kdd.type)
    const sysFromSpec = kdd.specSheet?.includes('-')
      ? kdd.specSheet.slice(kdd.specSheet.indexOf('-') + 1).trim()
      : kdd.subsystemCode
    dictSys.set(cle, sysFromSpec || kdd.subsystemCode)
    dictIdAff.set(cle, kdd.id)
  }

  // 2. Build undirected adjacency list and unique-neighbor degree map
  const dictRelId = new Map<string, string>()
  const dictRelNom = new Map<string, string>()
  const dictDegre = new Map<string, number>()
  const dictPaire = new Set<string>()
  const dictAdj = new Map<string, number[]>()
  const normRels: NormalizedRel[] = []

  const addAdj = (key: string, idx: number) => {
    const list = dictAdj.get(key)
    if (list) list.push(idx)
    else dictAdj.set(key, [idx])
  }

  for (const rel of relations) {
    const cSrc = canonicalKeyTD(rel.sourceId)
    const cCib = canonicalKeyTD(rel.targetId)
    if (!cSrc || !cCib) continue

    const idx = normRels.length
    normRels.push({
      cSrc,
      srcId: rel.sourceId,
      srcName: rel.sourceName,
      cCib,
      cibId: rel.targetId,
      cibName: rel.targetName,
      nature: rel.nature,
      justification: rel.justification,
    })

    if (!dictRelId.has(cSrc)) dictRelId.set(cSrc, rel.sourceId)
    if (!dictRelNom.has(cSrc)) dictRelNom.set(cSrc, rel.sourceName)
    if (!dictRelId.has(cCib)) dictRelId.set(cCib, rel.targetId)
    if (!dictRelNom.has(cCib)) dictRelNom.set(cCib, rel.targetName)

    if (cSrc !== cCib) {
      addAdj(cSrc, idx)
      addAdj(cCib, idx)
      const pairKey = cSrc < cCib ? `${cSrc}||${cCib}` : `${cCib}||${cSrc}`
      if (!dictPaire.has(pairKey)) {
        dictPaire.add(pairKey)
        dictDegre.set(cSrc, (dictDegre.get(cSrc) ?? 0) + 1)
        dictDegre.set(cCib, (dictDegre.get(cCib) ?? 0) + 1)
      }
    }
  }

  // 3. Identify target prestations matching theme
  const matchedPrestations: string[] = []
  for (const cP of dictAdj.keys()) {
    const typeVal = dictType.get(cP) ?? ''
    const nomVal = dictNom.get(cP) ?? dictRelNom.get(cP) ?? ''
    if (estUnePrestation(typeVal) && matchCategorie(choix, nomVal)) {
      matchedPrestations.push(cP)
    }
  }

  const getSysSafe = (cle: string) => dictSys.get(cle) ?? cle.split('|')[0] ?? ''
  const getIdSafe = (cle: string) => dictIdAff.get(cle) ?? dictRelId.get(cle) ?? ''
  const getNomSafe = (cle: string) => dictNom.get(cle) ?? dictRelNom.get(cle) ?? ''

  const dictDoublon = new Set<string>()
  const dictPrestTrouvees = new Set<string>()
  const dictSysTouches = new Set<string>()
  const rows: TopDownRow[] = []

  let directCount = 0
  let indirectCount = 0

  // 4. Level 1 (Direct: Prestation <-> Lever)
  for (const cP of matchedPrestations) {
    const col1 = dictAdj.get(cP) ?? []
    for (const idx1 of col1) {
      const r1 = normRels[idx1]
      const cl = r1.cSrc === cP ? r1.cCib : r1.cSrc
      const dirTxt =
        r1.cSrc === cP
          ? `[DIRECT] ${r1.nature} (Prestation <-> Levier)`
          : `[DIRECT] ${r1.nature} (Levier -> Prestation)`

      if (cl !== cP && estUnLevierPhysique(dictType.get(cl) ?? '')) {
        const dupKey = `${cP}|${cl}`
        if (!dictDoublon.has(dupKey)) {
          dictDoublon.add(dupKey)
          dictPrestTrouvees.add(cP)
          const sysL = getSysSafe(cl)
          if (sysL) dictSysTouches.add(sysL)

          const deg = dictDegre.get(cl) ?? 1
          const badge = formaterBadge(deg)
          const sideEffects = calculerEffetsDeBordFast(
            cl,
            cP,
            dictAdj,
            normRels,
            dictNom,
            dictIdAff,
          )
          const idP = getIdSafe(cP)
          const nomP = getNomSafe(cP)
          const idL = getIdSafe(cl)
          const nomL = getNomSafe(cl)

          directCount += 1
          rows.push({
            prestationId: idP,
            prestationName: nomP,
            prestationLabel: `${idP} - ${nomP}`,
            prestationSubsystem: getSysSafe(cP),
            leverSubsystem: sysL,
            leverId: idL,
            leverName: nomL,
            level: 1,
            isInterSystem: false,
            directionText: dirTxt,
            degree: deg,
            badge,
            sideEffects: sideEffects.items,
            sideEffectsText: sideEffects.formatted,
            justification: r1.justification,
          })
        }
      }
    }
  }

  // 5. Level 2 (Indirect: Lever -> Relay -> Prestation)
  for (const cP of matchedPrestations) {
    const sysP = getSysSafe(cP)
    const idP = getIdSafe(cP)
    const nomP = getNomSafe(cP)
    const col1 = dictAdj.get(cP) ?? []

    for (const idx1 of col1) {
      const r1 = normRels[idx1]
      const cm = r1.cSrc === cP ? r1.cCib : r1.cSrc
      if (cm === cP || !dictAdj.has(cm)) continue

      const idM = getIdSafe(cm)
      const col2 = dictAdj.get(cm) ?? []

      for (const idx2 of col2) {
        const r2 = normRels[idx2]
        const cl = r2.cSrc === cm ? r2.cCib : r2.cSrc
        if (cl === cm || cl === cP || !estUnLevierPhysique(dictType.get(cl) ?? '')) continue

        const dupKey = `${cP}|${cl}`
        if (dictDoublon.has(dupKey)) continue

        const sysL = getSysSafe(cl)
        const isInterSystem = sysL.toUpperCase() !== sysP.toUpperCase()

        if (!isAllThemes || isInterSystem) {
          dictDoublon.add(dupKey)
          dictPrestTrouvees.add(cP)
          if (sysL) dictSysTouches.add(sysL)

          const idL = getIdSafe(cl)
          const nomL = getNomSafe(cl)
          const deg = dictDegre.get(cl) ?? 1
          const badge = formaterBadge(deg)
          const sideEffects = calculerEffetsDeBordFast(
            cl,
            cP,
            dictAdj,
            normRels,
            dictNom,
            dictIdAff,
          )

          const dirTxt = isInterSystem
            ? `[INDIRECT INTER-SYS]\nvia ${idM}`
            : `[INDIRECT]\nvia ${idM}`

          let justTxt = `Chaine : ${idL} -> ${idM} -> ${idP}`
          if (r2.justification) justTxt += `\n1) ${r2.justification}`
          if (r1.justification) justTxt += `\n2) ${r1.justification}`

          indirectCount += 1
          rows.push({
            prestationId: idP,
            prestationName: nomP,
            prestationLabel: `${idP} - ${nomP}`,
            prestationSubsystem: sysP,
            leverSubsystem: sysL,
            leverId: idL,
            leverName: nomL,
            level: 2,
            isInterSystem,
            relayId: idM,
            directionText: dirTxt,
            degree: deg,
            badge,
            sideEffects: sideEffects.items,
            sideEffectsText: sideEffects.formatted,
            justification: justTxt,
          })
        }
      }
    }
  }

  // 6. Sort using exact `EstAvant` comparator
  rows.sort((a, b) => {
    if (estAvant(a, b)) return -1
    if (estAvant(b, a)) return 1
    return 0
  })

  // 7. Build subsystem summary & top 14 visualization levers (GenererVisuTopDown)
  const sysCounts = new Map<string, { direct: number; indirect: number }>()
  const seenLeverIds = new Set<string>()
  const dirLevers: TopDownVisuLever[] = []
  const indLevers: TopDownVisuLever[] = []

  for (const row of rows) {
    if (!row.leverSubsystem || !row.leverId) continue
    const entry = sysCounts.get(row.leverSubsystem) ?? { direct: 0, indirect: 0 }
    if (row.level === 1) entry.direct += 1
    else entry.indirect += 1
    sysCounts.set(row.leverSubsystem, entry)

    if (!seenLeverIds.has(row.leverId)) {
      seenLeverIds.add(row.leverId)
      const item: TopDownVisuLever = {
        subsystem: row.leverSubsystem,
        leverId: row.leverId,
        leverName: row.leverName,
        badge: row.badge,
        isDirect: row.level === 1,
      }
      if (row.level === 1) dirLevers.push(item)
      else indLevers.push(item)
    }
  }

  let maxDir = Math.min(9, dirLevers.length)
  let maxInd = Math.min(5, indLevers.length)
  if (maxDir + maxInd < 14 && dirLevers.length > maxDir) {
    maxDir = Math.min(dirLevers.length, 14 - maxInd)
  }
  if (maxDir + maxInd < 14 && indLevers.length > maxInd) {
    maxInd = Math.min(indLevers.length, 14 - maxDir)
  }

  const visuLevers = [...dirLevers.slice(0, maxDir), ...indLevers.slice(0, maxInd)]
  const subsystemSummary: SubsystemTopDownSummary[] = Array.from(sysCounts.entries()).map(
    ([subsystem, c]) => ({
      subsystem,
      directCount: c.direct,
      indirectCount: c.indirect,
      totalCount: c.direct + c.indirect,
    }),
  )

  return {
    theme: choix,
    totalRelationsAnalyzed: normRels.length,
    matchedPrestationsCount: dictPrestTrouvees.size,
    directCount,
    indirectCount,
    touchedSubsystemsCount: dictSysTouches.size,
    rows,
    subsystemSummary,
    visuLevers,
  }
}
