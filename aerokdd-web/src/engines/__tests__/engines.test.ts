import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { classifyAllKdds, classifyKdd, classifySpecRow } from '../classifier'
import { buildGlobalGraph, buildKddEgoGraph } from '../graphBuilder'
import { estAvant, matchCategorie, runTopDownAnalysis } from '../topDownEngine'
import { validateAllRelations, validateRelation } from '../validator'
import type { KDD, Relation } from '../../types/aerokdd'

const DATA_DIR = resolve(__dirname, '../../../public/data')
const kdds: KDD[] = JSON.parse(readFileSync(resolve(DATA_DIR, 'kdds.json'), 'utf-8'))
const relations: Relation[] = JSON.parse(
  readFileSync(resolve(DATA_DIR, 'relations.json'), 'utf-8'),
)
const bibliotheque: Relation[] = JSON.parse(
  readFileSync(resolve(DATA_DIR, 'bibliotheque.json'), 'utf-8'),
)

describe('classifier.ts (mod_Admin_FiltreSPEC)', () => {
  it('classifies FAN-020 (Pressure Ratio) as KDD - Key Design Driver (FPR)', () => {
    const fan020 = kdds.find((k) => k.id === 'FAN-020')
    expect(fan020).toBeDefined()
    const result = classifyKdd(fan020!)
    expect(result.statut).toBe('KDD - Key Design Driver (FPR)')
    expect(result.shortCategory).toBe('KDD')
    expect(result.isBold).toBe(true)
  })

  it('classifies FAN-032 (Type Fan) as KDD - Key Design Driver', () => {
    const fan032 = kdds.find((k) => k.id === 'FAN-032')
    expect(fan032).toBeDefined()
    const result = classifyKdd(fan032!)
    expect(result.statut).toBe('KDD - Key Design Driver')
    expect(result.shortCategory).toBe('KDD')
    expect(result.isBold).toBe(true)
  })

  it('applies exact VBA override rules (Robustness Strategy, Thermal Growth/Creep, Safety/HED/Burst)', () => {
    expect(
      classifySpecRow({
        sheetName: 'SPEC-FAN',
        name: 'Robustness Strategy',
        type: 'Solution Parameter',
        classification: 'K',
      }).statut,
    ).toBe('Contrainte / Strategie')

    expect(
      classifySpecRow({
        sheetName: 'SPEC-HPT',
        name: 'Thermal Growth & Creep Limits',
        type: 'Induced Effect',
      }).statut,
    ).toBe('Contrainte / RAMS')

    expect(
      classifySpecRow({
        sheetName: 'SPEC-HPT',
        name: 'HED / Rotor Burst Protection',
        type: 'Solution Parameter',
        classification: 'S',
      }).statut,
    ).toBe('Contrainte / RAMS')

    expect(
      classifySpecRow({
        sheetName: 'SPEC-FAN',
        name: 'Hub-to-Tip Ratio',
        type: 'Solution Parameter',
        classification: '',
        familyNumber: 4,
      }).statut,
    ).toBe('S - Sizing Parameter')
  })

  it('matches extracted statutKdd across all 566 KDDs in kdds.json', () => {
    const { kdds: reclassified, counts } = classifyAllKdds(kdds)
    expect(counts.total).toBe(566)

    const mismatches = reclassified.filter((k, idx) => {
      const original = kdds[idx].statutKdd
      return original !== '' && original !== k.statutKdd
    })
    expect(mismatches).toEqual([])
  })
})

describe('topDownEngine.ts (mod_AnalyseTopDown)', () => {
  it('surfaces FAN-035 as CARREFOUR on "Bruit / Acoustique" matching Guide_AeroKDD.pdf §6.1', () => {
    const result = runTopDownAnalysis(kdds, relations, 'Bruit / Acoustique')

    expect(result.matchedPrestationsCount).toBe(6)
    expect(result.directCount).toBe(23)
    expect(result.indirectCount).toBe(32)
    expect(result.touchedSubsystemsCount).toBe(7)
    expect(result.rows.length).toBe(55)

    // Top-ranked row must be FAN-035 (Rotational Speed Range) as CARREFOUR
    const topRow = result.rows[0]
    expect(topRow.leverId).toBe('FAN-035')
    expect(topRow.leverName).toBe('Rotational Speed Range')
    expect(topRow.level).toBe(1)
    expect(topRow.badge.level).toBe('CARREFOUR')
    expect(topRow.degree).toBeGreaterThanOrEqual(8)
    expect(topRow.sideEffects.length).toBeGreaterThan(0)
    expect(topRow.sideEffects.some((se) => se.kddId === topRow.prestationId)).toBe(false)
  })

  it('matches both accented and unaccented theme names across all 10 categories', () => {
    expect(matchCategorie('Bruit / Acoustique', 'Acoustic Signature')).toBe(true)
    expect(matchCategorie('Poussée / Débit', 'Mass Flow')).toBe(true)
    expect(matchCategorie('Poussee / Debit', 'Pressure Ratio')).toBe(true)
    expect(matchCategorie('Émissions (NOx / CO)', 'NOx Emissions')).toBe(true)
    expect(matchCategorie('Stabilité / Pompage', 'Compressor Surge Margin')).toBe(true)
    expect(matchCategorie('Thermique / Durée de vie', 'Blade Creep Life')).toBe(true)
    expect(matchCategorie('Sécurité / Chocs / Burst', 'Bird Strike Tolerance')).toBe(true)
    expect(matchCategorie('Coût / Maintenance', 'Operating Costs & DMC')).toBe(true)
  })

  it('enforces exact EstAvant sorting precedence', () => {
    const directLow = { level: 1 as const, isInterSystem: false, degree: 2, prestationLabel: 'Z' }
    const indirectHigh = { level: 2 as const, isInterSystem: true, degree: 15, prestationLabel: 'A' }
    const indirectIntra = { level: 2 as const, isInterSystem: false, degree: 15, prestationLabel: 'A' }

    expect(estAvant(directLow, indirectHigh)).toBe(true)
    expect(estAvant(indirectHigh, indirectIntra)).toBe(true)
  })
})

describe('validator.ts (mod_Admin_TriRelations)', () => {
  const baseRel: Relation = {
    id: 'REL-TEST',
    sourceId: 'FAN-035',
    sourceName: 'Rotational Speed Range',
    sourceSubsystem: 'FAN',
    targetId: 'FAN-034',
    targetName: 'U-Tip',
    targetSubsystem: 'FAN',
    nature: 'Relation cinématique',
    influence: 'Couplage',
    justification: 'La vitesse périphérique découle directement du régime de rotation.',
    equation: 'U_tip = w * R_tip',
    requiredData: 'rad/s, m',
    sourceRef: 'REF-01',
    validationStatus: '',
    notes: '',
  }

  it('validates Validé, Candidat, Auto-relation, Revue manuelle, and preserves Rejeté', () => {
    expect(validateRelation(baseRel).status).toBe('Validé')

    expect(validateRelation({ ...baseRel, equation: '' }).status).toBe('Candidat — à valider')

    expect(validateRelation({ ...baseRel, targetId: 'FAN-035' }).status).toBe(
      'A verifier (Auto-relation)',
    )

    expect(validateRelation({ ...baseRel, notes: 'Paire inverse avec REL-099' }).status).toBe(
      'A verifier (Revue manuelle)',
    )

    expect(validateRelation({ ...baseRel, validationStatus: 'Rejeté' }).category).toBe('REJECTED')
  })

  it('audits all 1,267 active relations and 1,364 bibliotheque relations with 0 directed duplicates', () => {
    const batch = validateAllRelations(relations)
    expect(batch.counts.total).toBe(1267)
    expect(batch.counts.exactDuplicates).toBe(0)
    expect(batch.counts.autoRelations).toBe(0)
    expect(batch.counts.inversePairs).toBe(8)

    const bibBatch = validateAllRelations(bibliotheque)
    expect(bibBatch.counts.total).toBe(1364)
    expect(bibBatch.counts.exactDuplicates).toBe(0)
    expect(bibBatch.counts.inversePairs).toBe(10)
  })
})

describe('graphBuilder.ts (mod_GrapheGlobal & mod_GraphKDD_Schema)', () => {
  it('builds the 10-subsystem circular layout matching Guide_AeroKDD.pdf §7.1 metrics', () => {
    const graph = buildGlobalGraph(kdds, relations)
    expect(graph.clusters.length).toBe(10)
    expect(graph.metrics.nodeCount).toBe(566)
    expect(graph.metrics.leverNodeCount).toBe(205)
    expect(graph.metrics.prestNodeCount).toBe(155)
    expect(graph.metrics.otherNodeCount).toBe(206)

    for (const node of graph.nodes) {
      expect(Number.isFinite(node.x)).toBe(true)
      expect(Number.isFinite(node.y)).toBe(true)
    }
  })

  it('builds the filtered FAN graph matching Guide_AeroKDD.pdf §7.3 metrics', () => {
    const fanGraph = buildGlobalGraph(kdds, relations, 'FAN')
    expect(fanGraph.clusters.length).toBe(1)
    expect(fanGraph.metrics.nodeCount).toBe(47)
    expect(fanGraph.metrics.leverNodeCount).toBe(16)
    expect(fanGraph.metrics.prestNodeCount).toBe(11)
    expect(fanGraph.metrics.otherNodeCount).toBe(20)
    expect(fanGraph.metrics.drawnRelations).toBe(104)
    expect(
      fanGraph.metrics.topDownRelations +
        fanGraph.metrics.couplingRelations +
        fanGraph.metrics.contextRelations,
    ).toBe(104)
  })

  it('builds the unit ego-graph for BOOSTER-021 matching Guide_AeroKDD.pdf §5.1', () => {
    const ego = buildKddEgoGraph(kdds, relations, 'BOOSTER-021')
    expect(ego.selectedKdd?.id).toBe('BOOSTER-021')
    expect(ego.incoming.length).toBe(22)
    expect(ego.outgoing.length).toBe(1)
    expect(ego.allLinks.length).toBe(23)
  })
})
