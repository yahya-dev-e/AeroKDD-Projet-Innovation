import type { KDD, ShortNodeCategory, StatutKdd } from '../types/aerokdd'

export interface SpecClassificationInput {
  sheetName: string
  name: string
  type: string
  classification?: string
  familyNumber?: number
}

export interface ClassificationResult {
  statut: StatutKdd
  shortCategory: ShortNodeCategory
  fillHex: string
  textHex: string
  isBold: boolean
  tokenPrefix: string
}

export interface ClassificationCounts {
  total: number
  kdd: number
  sizing: number
  design: number
  prestation: number
  effetInduit: number
  input: number
  contrainte: number
}

/**
 * Extracts family number (1..5) from labels such as
 * "F4 — Solution Parameters / Global" or "FAMILLE 4".
 */
export function extractFamilyNumber(family: string): number {
  const upper = (family || '').toUpperCase()
  for (let i = 1; i <= 5; i++) {
    if (upper.includes(`FAMILLE ${i}`) || upper.startsWith(`F${i}`) || upper.includes(` F${i}`)) {
      return i
    }
  }
  return 0
}

/**
 * Exact port of `Filtre_ClassifierLigne` from `mod_Admin_FiltreSPEC`.
 * Preserves the exact override precedence:
 * 1. FAN Pressure Ratio -> KDD - Key Design Driver (FPR)
 * 2. Robustness Strategy -> Contrainte / Strategie
 * 3. Thermal Growth + Creep -> Contrainte / RAMS
 * 4. Safety / HED / Burst Protection -> Contrainte / RAMS
 * 5. Solution / Param -> KDD / S / D (with family 4 fallback to S)
 * 6. Constraint / Contraint -> Contrainte / RAMS
 * 7. Input / Envt / Interface -> Input / Interface
 * 8. Induced -> Effet Induit (Prestation)
 * 9. Attente / Perfo -> Prestation / Performance
 * 10. Else -> A verifier
 */
export function classifySpecRow(input: SpecClassificationInput): ClassificationResult {
  const shName = (input.sheetName || '').trim().toUpperCase()
  const n = (input.name || '').trim().toUpperCase()
  const t = (input.type || '').trim().toUpperCase()
  const ksdVal = (input.classification || '').trim().toUpperCase()
  const famNum = input.familyNumber ?? 0

  if (shName.includes('FAN') && n.includes('PRESSURE RATIO')) {
    return {
      statut: 'KDD - Key Design Driver (FPR)',
      shortCategory: 'KDD',
      fillHex: '#d9ead3',
      textHex: '#274e13',
      isBold: true,
      tokenPrefix: '--akdd-status-kdd',
    }
  }

  if (n.includes('ROBUSTNESS STRATEGY')) {
    return {
      statut: 'Contrainte / Strategie',
      shortCategory: 'CONTRAINTE',
      fillHex: '#f4cccc',
      textHex: '#990000',
      isBold: false,
      tokenPrefix: '--akdd-status-contrainte',
    }
  }

  if (n.includes('THERMAL GROWTH') && n.includes('CREEP')) {
    return {
      statut: 'Contrainte / RAMS',
      shortCategory: 'CONTRAINTE',
      fillHex: '#f4cccc',
      textHex: '#990000',
      isBold: false,
      tokenPrefix: '--akdd-status-contrainte',
    }
  }

  if (n.includes('SAFETY') || n.includes('HED') || n.includes('BURST PROTECTION')) {
    return {
      statut: 'Contrainte / RAMS',
      shortCategory: 'CONTRAINTE',
      fillHex: '#f4cccc',
      textHex: '#990000',
      isBold: false,
      tokenPrefix: '--akdd-status-contrainte',
    }
  }

  if (t.includes('SOLUTION') || t.includes('PARAM')) {
    if (ksdVal === 'K') {
      return {
        statut: 'KDD - Key Design Driver',
        shortCategory: 'KDD',
        fillHex: '#d9ead3',
        textHex: '#274e13',
        isBold: true,
        tokenPrefix: '--akdd-status-kdd',
      }
    }
    if (ksdVal === 'S') {
      return {
        statut: 'S - Sizing Parameter',
        shortCategory: 'S',
        fillHex: '#cfe2f3',
        textHex: '#0b5394',
        isBold: true,
        tokenPrefix: '--akdd-status-s',
      }
    }
    if (ksdVal === 'D') {
      return {
        statut: 'D - Design Parameter',
        shortCategory: 'D',
        fillHex: '#eaf2f8',
        textHex: '#244062',
        isBold: false,
        tokenPrefix: '--akdd-status-d',
      }
    }
    if (famNum === 4) {
      return {
        statut: 'S - Sizing Parameter',
        shortCategory: 'S',
        fillHex: '#cfe2f3',
        textHex: '#0b5394',
        isBold: true,
        tokenPrefix: '--akdd-status-s',
      }
    }
    return {
      statut: 'D - Design Parameter',
      shortCategory: 'D',
      fillHex: '#eaf2f8',
      textHex: '#244062',
      isBold: false,
      tokenPrefix: '--akdd-status-d',
    }
  }

  if (t.includes('CONSTRAINT') || t.includes('CONTRAINT')) {
    return {
      statut: 'Contrainte / RAMS',
      shortCategory: 'CONTRAINTE',
      fillHex: '#f4cccc',
      textHex: '#990000',
      isBold: false,
      tokenPrefix: '--akdd-status-contrainte',
    }
  }

  if (t.includes('INPUT') || t.includes('ENVT') || t.includes('INTERFACE')) {
    return {
      statut: 'Input / Interface',
      shortCategory: 'INPUT',
      fillHex: '#eeeeee',
      textHex: '#434343',
      isBold: false,
      tokenPrefix: '--akdd-status-input',
    }
  }

  if (t.includes('INDUCED')) {
    return {
      statut: 'Effet Induit (Prestation)',
      shortCategory: 'PRESTATION',
      fillHex: '#fce5cd',
      textHex: '#783f04',
      isBold: false,
      tokenPrefix: '--akdd-status-effet',
    }
  }

  if (t.includes('ATTENTE') || t.includes('PERFO')) {
    return {
      statut: 'Prestation / Performance',
      shortCategory: 'PRESTATION',
      fillHex: '#fff2cc',
      textHex: '#7f6000',
      isBold: false,
      tokenPrefix: '--akdd-status-prestation',
    }
  }

  return {
    statut: 'A verifier',
    shortCategory: 'AUTRE',
    fillHex: '#ffffff',
    textHex: '#000000',
    isBold: false,
    tokenPrefix: '--akdd-status-input',
  }
}

export function classifyKdd(kdd: KDD): ClassificationResult {
  return classifySpecRow({
    sheetName: kdd.specSheet || kdd.subsystemCode,
    name: kdd.name,
    type: kdd.type,
    classification: kdd.classification,
    familyNumber: extractFamilyNumber(kdd.family),
  })
}

/**
 * Bulk re-classification mirroring `AjouterColonneClassificationTousSPEC`.
 */
export function classifyAllKdds(kdds: KDD[]): {
  kdds: KDD[]
  counts: ClassificationCounts
} {
  const counts: ClassificationCounts = {
    total: 0,
    kdd: 0,
    sizing: 0,
    design: 0,
    prestation: 0,
    effetInduit: 0,
    input: 0,
    contrainte: 0,
  }

  const updated = kdds.map((kdd) => {
    const result = classifyKdd(kdd)
    counts.total += 1

    if (result.statut.startsWith('KDD')) {
      counts.kdd += 1
    } else if (result.statut.startsWith('S -')) {
      counts.sizing += 1
    } else if (result.statut.startsWith('D -')) {
      counts.design += 1
    } else if (result.statut.startsWith('Prestation')) {
      counts.prestation += 1
    } else if (result.statut.startsWith('Effet Induit')) {
      counts.effetInduit += 1
    } else if (result.statut.startsWith('Input')) {
      counts.input += 1
    } else {
      counts.contrainte += 1
    }

    return {
      ...kdd,
      statutKdd: result.statut,
    }
  })

  return { kdds: updated, counts }
}
