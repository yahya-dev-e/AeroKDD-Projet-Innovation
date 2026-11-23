import { create } from 'zustand'
import { classifyAllKdds, classifyKdd, type ClassificationCounts } from '../engines/classifier'
import { normalizeSubsystemCode } from '../engines/graphBuilder'
import { validateAllRelations, type ValidationBatchResult } from '../engines/validator'
import type {
  AeroKddDataset,
  BibliothequeRelation,
  KDD,
  Relation,
  RelationValidationStatus,
  Requirement,
  SourceRef,
  TracaEntry,
} from '../types/aerokdd'

const STORAGE_KEY = 'aerokdd:dataset:v1'

/**
 * Clean repository abstraction so LocalStorage + static `/data/*.json`
 * can later be swapped with a Supabase / PostgreSQL adapter without
 * changing any UI or engine code.
 */
export interface AeroKddRepository {
  loadDataset(): Promise<AeroKddDataset>
  saveDataset(dataset: AeroKddDataset): Promise<void>
  resetDataset(): Promise<AeroKddDataset>
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}

export class LocalJsonAeroKddRepository implements AeroKddRepository {
  private readonly basePath: string
  private readonly storageKey: string

  constructor(basePath = '/data', storageKey = STORAGE_KEY) {
    this.basePath = basePath.replace(/\/+$/, '')
    this.storageKey = storageKey
  }

  private readStorage(): AeroKddDataset | null {
    if (typeof window === 'undefined' || !window.localStorage) return null
    try {
      const raw = window.localStorage.getItem(this.storageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<AeroKddDataset>
      if (!Array.isArray(parsed.kdds) || !Array.isArray(parsed.relations)) {
        return null
      }
      return {
        kdds: parsed.kdds,
        relations: parsed.relations,
        bibliotheque: Array.isArray(parsed.bibliotheque) ? parsed.bibliotheque : [],
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
        tracaEntries: Array.isArray(parsed.tracaEntries) ? parsed.tracaEntries : [],
      }
    } catch {
      return null
    }
  }

  private writeStorage(dataset: AeroKddDataset): void {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(dataset))
    } catch {
      // Ignore quota exceeded in constrained environments; state remains in memory
    }
  }

  private async fetchSeedDataset(): Promise<AeroKddDataset> {
    const [kdds, relations, bibliotheque, sources] = await Promise.all([
      fetchJson<KDD[]>(`${this.basePath}/kdds.json`),
      fetchJson<Relation[]>(`${this.basePath}/relations.json`),
      fetchJson<BibliothequeRelation[]>(`${this.basePath}/bibliotheque.json`),
      fetchJson<SourceRef[]>(`${this.basePath}/sources.json`),
    ])

    return {
      kdds,
      relations,
      bibliotheque,
      sources,
      requirements: [],
      tracaEntries: [],
    }
  }

  async loadDataset(): Promise<AeroKddDataset> {
    const cached = this.readStorage()
    if (cached) return cached
    const seed = await this.fetchSeedDataset()
    this.writeStorage(seed)
    return seed
  }

  async saveDataset(dataset: AeroKddDataset): Promise<void> {
    this.writeStorage(dataset)
  }

  async resetDataset(): Promise<AeroKddDataset> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.storageKey)
    }
    const seed = await this.fetchSeedDataset()
    this.writeStorage(seed)
    return seed
  }
}

let activeRepository: AeroKddRepository = new LocalJsonAeroKddRepository()

export function setAeroKddRepository(repository: AeroKddRepository): void {
  activeRepository = repository
}

export function getAeroKddRepository(): AeroKddRepository {
  return activeRepository
}

export type NewKddInput = Omit<KDD, 'id' | 'selectionKey' | 'number' | 'statutKdd'> & {
  id?: string
}

export type NewRelationInput = Omit<Relation, 'id'>

function computeNextKddId(kdds: KDD[], subsystemCode: string): { id: string; number: number } {
  const norm = normalizeSubsystemCode(subsystemCode)
  let maxNum = 0
  for (const kdd of kdds) {
    if (normalizeSubsystemCode(kdd.subsystemCode, kdd.subsystemLabel) !== norm) continue
    const match = kdd.id.match(/-(\d+)$/)
    const num = match ? Number.parseInt(match[1], 10) : (kdd.number ?? 0)
    if (num > maxNum) maxNum = num
  }
  const next = maxNum + 1
  return {
    id: `${norm}-${String(next).padStart(3, '0')}`,
    number: next,
  }
}

function computeNextRelationId(relations: Relation[], prefix = 'REL'): string {
  let maxNum = 0
  for (const rel of relations) {
    const match = rel.id.match(/(\d+)$/)
    if (match) {
      const n = Number.parseInt(match[1], 10)
      if (n > maxNum) maxNum = n
    }
  }
  const pad = prefix === 'B-REL' ? 4 : 3
  return `${prefix}-${String(maxNum + 1).padStart(pad, '0')}`
}

function computeNextTracaId(entries: TracaEntry[], subsystemCode: string): string {
  const norm = normalizeSubsystemCode(subsystemCode)
  let maxNum = 0
  for (const entry of entries) {
    if (normalizeSubsystemCode(entry.subsystemCode) !== norm) continue
    const match = entry.id.match(/(\d+)$/)
    if (match) {
      const n = Number.parseInt(match[1], 10)
      if (n > maxNum) maxNum = n
    }
  }
  return `TRC-${norm}-${String(maxNum + 1).padStart(3, '0')}`
}

function computeNextRequirementId(requirements: Requirement[]): string {
  let maxNum = 0
  for (const req of requirements) {
    const match = req.id.match(/(\d+)$/)
    if (match) {
      const n = Number.parseInt(match[1], 10)
      if (n > maxNum) maxNum = n
    }
  }
  return `REQ-${String(maxNum + 1).padStart(3, '0')}`
}

export interface AeroKddState extends AeroKddDataset {
  isLoaded: boolean
  isLoading: boolean
  error: string | null

  initialize: (forceReload?: boolean) => Promise<void>
  resetToSeed: () => Promise<void>
  getNextKddId: (subsystemCode: string) => string
  getNextRequirementId: () => string
  addKddWithRelations: (input: NewKddInput, linkedRelations?: NewRelationInput[]) => Promise<KDD>
  deleteKdd: (kddId: string) => Promise<void>
  updateRelationValidationStatus: (
    relationId: string,
    status: RelationValidationStatus,
  ) => Promise<void>
  addRequirement: (req: Omit<Requirement, 'id'> & { id?: string }) => Promise<Requirement>
  updateRequirement: (reqId: string, patch: Partial<Omit<Requirement, 'id'>>) => Promise<void>
  deleteRequirement: (reqId: string) => Promise<void>
  addTracaEntry: (entry: Omit<TracaEntry, 'id'> & { id?: string }) => Promise<TracaEntry>
  updateTracaEntry: (entryId: string, patch: Partial<Omit<TracaEntry, 'id'>>) => Promise<void>
  deleteTracaEntry: (entryId: string) => Promise<void>
  reclassifyAllKdds: () => Promise<ClassificationCounts>
  revalidateAllRelations: () => Promise<ValidationBatchResult>
}

function extractDataset(state: AeroKddState): AeroKddDataset {
  return {
    kdds: state.kdds,
    relations: state.relations,
    bibliotheque: state.bibliotheque,
    sources: state.sources,
    requirements: state.requirements,
    tracaEntries: state.tracaEntries,
  }
}

export const useAeroKddStore = create<AeroKddState>((set, get) => ({
  kdds: [],
  relations: [],
  bibliotheque: [],
  sources: [],
  requirements: [],
  tracaEntries: [],
  isLoaded: false,
  isLoading: false,
  error: null,

  async initialize(forceReload = false) {
    const state = get()
    if (state.isLoading || (state.isLoaded && !forceReload)) return
    set({ isLoading: true, error: null })
    try {
      const dataset = await activeRepository.loadDataset()
      set({
        ...dataset,
        isLoaded: true,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur lors du chargement des données AeroKDD',
      })
    }
  },

  async resetToSeed() {
    set({ isLoading: true, error: null })
    try {
      const dataset = await activeRepository.resetDataset()
      set({
        ...dataset,
        isLoaded: true,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur lors de la réinitialisation',
      })
    }
  },

  getNextKddId(subsystemCode: string) {
    return computeNextKddId(get().kdds, subsystemCode).id
  },

  getNextRequirementId() {
    return computeNextRequirementId(get().requirements)
  },

  async addKddWithRelations(input, linkedRelations = []) {
    const state = get()
    const generated = computeNextKddId(state.kdds, input.subsystemCode)
    const id = input.id?.trim() || generated.id
    const numberMatch = id.match(/-(\d+)$/)
    const number = numberMatch ? Number.parseInt(numberMatch[1], 10) : generated.number

    const draftKdd: KDD = {
      ...input,
      id,
      number,
      selectionKey: `${id} | ${input.name}`,
      statutKdd: '',
    }
    const classification = classifyKdd(draftKdd)
    const createdKdd: KDD = {
      ...draftKdd,
      statutKdd: classification.statut,
    }

    const updatedKdds = [...state.kdds, createdKdd]
    const updatedRelations = [...state.relations]
    const updatedBib = [...state.bibliotheque]

    for (const relInput of linkedRelations) {
      const relId = computeNextRelationId(updatedRelations, 'REL')
      const rel: Relation = { ...relInput, id: relId }
      updatedRelations.push(rel)

      const srcNorm = normalizeSubsystemCode(rel.sourceSubsystem)
      const tgtNorm = normalizeSubsystemCode(rel.targetSubsystem)
      const bibEntry: BibliothequeRelation = {
        ...rel,
        id: computeNextRelationId(updatedBib, 'B-REL'),
        sourceFamily: rel.sourceId === id ? createdKdd.family : '',
        targetFamily: rel.targetId === id ? createdKdd.family : '',
        scope: srcNorm === tgtNorm ? 'Intra-sous-système' : 'Inter-sous-systèmes',
        maturity: 'E2',
        reviewAction: '',
      }
      updatedBib.push(bibEntry)
    }

    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      kdds: updatedKdds,
      relations: updatedRelations,
      bibliotheque: updatedBib,
    }
    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
    return createdKdd
  },

  async deleteKdd(kddId: string) {
    const target = kddId.trim().toUpperCase()
    const state = get()

    // Preserves ID invariance: never renumber remaining KDDs (Guide_AeroKDD.pdf §4.3)
    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      kdds: state.kdds.filter((k) => k.id.trim().toUpperCase() !== target),
      relations: state.relations.filter(
        (r) =>
          r.sourceId.trim().toUpperCase() !== target && r.targetId.trim().toUpperCase() !== target,
      ),
      bibliotheque: state.bibliotheque.filter(
        (r) =>
          r.sourceId.trim().toUpperCase() !== target && r.targetId.trim().toUpperCase() !== target,
      ),
      tracaEntries: state.tracaEntries.filter((t) => t.kddId.trim().toUpperCase() !== target),
    }

    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
  },

  async updateRelationValidationStatus(relationId, status) {
    const state = get()
    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      relations: state.relations.map((r) =>
        r.id === relationId ? { ...r, validationStatus: status } : r,
      ),
    }
    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
  },

  async addRequirement(reqInput) {
    const state = get()
    const id = reqInput.id?.trim() || computeNextRequirementId(state.requirements)
    const created: Requirement = { ...reqInput, id }
    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      requirements: [...state.requirements, created],
    }
    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
    return created
  },

  async updateRequirement(reqId, patch) {
    const state = get()
    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      requirements: state.requirements.map((r) => (r.id === reqId ? { ...r, ...patch } : r)),
    }
    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
  },

  async deleteRequirement(reqId) {
    const state = get()
    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      requirements: state.requirements.filter((r) => r.id !== reqId),
    }
    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
  },

  async addTracaEntry(entryInput) {
    const state = get()
    const id = entryInput.id?.trim() || computeNextTracaId(state.tracaEntries, entryInput.subsystemCode)
    const created: TracaEntry = { ...entryInput, id }
    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      tracaEntries: [...state.tracaEntries, created],
    }
    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
    return created
  },

  async updateTracaEntry(entryId, patch) {
    const state = get()
    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      tracaEntries: state.tracaEntries.map((t) => (t.id === entryId ? { ...t, ...patch } : t)),
    }
    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
  },

  async deleteTracaEntry(entryId) {
    const state = get()
    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      tracaEntries: state.tracaEntries.filter((t) => t.id !== entryId),
    }
    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
  },

  async reclassifyAllKdds() {
    const state = get()
    const { kdds, counts } = classifyAllKdds(state.kdds)
    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      kdds,
    }
    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
    return counts
  },

  async revalidateAllRelations() {
    const state = get()
    const batch = validateAllRelations(state.relations)
    const nextDataset: AeroKddDataset = {
      ...extractDataset(state),
      relations: batch.relations,
    }
    set(nextDataset)
    await activeRepository.saveDataset(nextDataset)
    return batch
  },
}))
