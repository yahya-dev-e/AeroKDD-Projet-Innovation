export type SubsystemCode =
  | 'FAN'
  | 'BOOSTER'
  | 'HPC'
  | 'COMB'
  | 'HPT'
  | 'LPT'
  | 'NOZZLE'
  | 'COOLING'
  | 'ELECTRICAL'
  | 'OIL'

export type KddClassification = 'K' | 'S' | 'D' | ''

export type KddType =
  | 'Solution Parameter'
  | 'Attente / Perfo fonctionnelle'
  | 'Induced Effect'
  | 'Input / Envt'
  | 'Constraint'
  | (string & {})

export type StatutKdd =
  | 'KDD - Key Design Driver'
  | 'KDD - Key Design Driver (FPR)'
  | 'S - Sizing Parameter'
  | 'D - Design Parameter'
  | 'Prestation / Performance'
  | 'Effet Induit (Prestation)'
  | 'Input / Interface'
  | 'Contrainte / RAMS'
  | 'Contrainte / Strategie'
  | 'A verifier'
  | ''

export type ShortNodeCategory =
  | 'KDD'
  | 'S'
  | 'D'
  | 'PRESTATION'
  | 'INPUT'
  | 'CONTRAINTE'
  | 'AUTRE'

export type RelationValidationStatus =
  | 'Validé'
  | 'A verifier (Auto-relation)'
  | 'A verifier (Revue manuelle)'
  | 'Candidat — à valider'
  | 'Rejeté'
  | (string & {})

export type RelationStatusBucket = 'VALIDATED' | 'CANDIDATE' | 'REJECTED'

export type GraphLinkKind = 'TOP_DOWN' | 'COUPLAGE' | 'CONTEXTE'

export interface KDD {
  id: string
  selectionKey: string
  subsystemCode: SubsystemCode | (string & {})
  subsystemLabel: string
  specSheet: string
  family: string
  number: number | null
  name: string
  definition: string
  type: KddType
  classification: KddClassification
  level: 'Système' | 'Sous-Système' | (string & {})
  importance: string
  techChoices: string
  locks: string
  lockNature: string
  specRef: string
  statutKdd: StatutKdd
}

export interface Relation {
  id: string
  sourceId: string
  sourceName: string
  sourceSubsystem: string
  targetId: string
  targetName: string
  targetSubsystem: string
  nature: string
  influence: string
  justification: string
  equation: string
  requiredData: string
  sourceRef: string
  validationStatus: RelationValidationStatus
  notes: string
}

export interface BibliothequeRelation extends Relation {
  sourceFamily: string
  targetFamily: string
  scope: string
  maturity: string
  reviewAction: string
}

export interface SourceRef {
  id: string
  organization: string
  title: string
  domains: string
  url: string
  scopeLimits: string
}

/**
 * Mirrors the 14-column `Requirements` sheet (A:N) from Guide_AeroKDD.pdf §2.5.
 */
export interface Requirement {
  id: string
  level: 'Système' | 'Sous-Système' | (string & {})
  subsystemCode: SubsystemCode | (string & {})
  text: string
  type: string
  verificationMethod: string
  acceptanceCriteria: string
  unit: string
  source: string
  kddId: string
  kddName: string
  status: string
  proof: string
  owner: string
}

/**
 * Mirrors the 12-column `TRACA SYS-*` sheet (A:L) from Guide_AeroKDD.pdf §3.3.
 */
export interface TracaEntry {
  id: string // e.g. TRC-FAN-001
  subsystemCode: SubsystemCode | (string & {})
  systemElement: string
  systemFunction: string
  requirementId: string
  kddId: string
  kddName: string
  verificationMethod: string
  proof: string
  status: string
  owner: string
  notes: string
}

export interface AeroKddDataset {
  kdds: KDD[]
  relations: Relation[]
  bibliotheque: BibliothequeRelation[]
  sources: SourceRef[]
  requirements: Requirement[]
  tracaEntries: TracaEntry[]
}
