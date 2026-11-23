import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Compass,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  KsdBadge,
  StatutBadge,
  SubsystemBadge,
  Tabs,
} from '../components/ui'
import { classifySpecRow, extractFamilyNumber } from '../engines/classifier'
import { buildKddEgoGraph, normalizeSubsystemCode } from '../engines/graphBuilder'
import { useAeroKddStore, type NewRelationInput } from '../store/useAeroKddStore'
import type { KddClassification, SubsystemCode } from '../types/aerokdd'
import { getSubsystemMeta, SUBSYSTEM_CATALOG } from '../types/subsystems'

type ManagerTab = 'ADD' | 'DELETE'

const MAX_RELATIONS = 20

const FAMILIES = [
  'F1 — Programme & cycle de vie',
  'F2 — Inputs / Environnement & interfaces',
  'F3 — Attentes fonctionnelles / Effets induits / RAMS',
  'F4 — Solution Parameters / Global',
  'F5 — Solution Parameters / Sous-système',
]

const KDD_TYPES = [
  'Solution Parameter',
  'Attente / Perfo fonctionnelle',
  'Induced Effect',
  'Input / Envt',
  'Constraint',
]

interface StagedRelation {
  key: string
  direction: 'OUT' | 'IN'
  peerId: string
  peerName: string
  peerSubsystem: string
  scope: 'Intra-sous-système' | 'Inter-sous-systèmes'
  nature: string
  influence: string
  justification: string
  equation: string
  sourceRef: string
}

export function ManagerPage() {
  const {
    kdds,
    relations,
    sources,
    getNextKddId,
    addKddWithRelations,
    deleteKdd,
  } = useAeroKddStore()

  const [activeTab, setActiveTab] = useState<ManagerTab>('ADD')

  // --- ADD FORM STATE ---
  const [subsystemCode, setSubsystemCode] = useState<SubsystemCode>('FAN')
  const [family, setFamily] = useState(FAMILIES[3])
  const [name, setName] = useState('')
  const [definition, setDefinition] = useState('')
  const [type, setType] = useState(KDD_TYPES[0])
  const [classification, setClassification] = useState<KddClassification>('K')
  const [level, setLevel] = useState<'Système' | 'Sous-Système'>('Sous-Système')
  const [importance, setImportance] = useState('')
  const [techChoices, setTechChoices] = useState('')
  const [locks, setLocks] = useState('')
  const [lockNature, setLockNature] = useState('')

  // Staged relation builder
  const [relPeerSubsystem, setRelPeerSubsystem] = useState<string>('ALL')
  const [relPeerId, setRelPeerId] = useState<string>('')
  const [relDirection, setRelDirection] = useState<'OUT' | 'IN'>('OUT')
  const [relNature, setRelNature] = useState('Dépendance fonctionnelle')
  const [relInfluence, setRelInfluence] = useState('Influence')
  const [relJustification, setRelJustification] = useState('')
  const [relEquation, setRelEquation] = useState('')
  const [relSourceRef, setRelSourceRef] = useState('')
  const [stagedRelations, setStagedRelations] = useState<StagedRelation[]>([])
  const [relError, setRelError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<{ id: string; relCount: number } | null>(null)

  // --- DELETE FORM STATE ---
  const [delSubFilter, setDelSubFilter] = useState<string>('ALL')
  const [delQuery, setDelQuery] = useState('')
  const [delSelectedId, setDelSelectedId] = useState<string>('')
  const [delConfirmed, setDelConfirmed] = useState(false)
  const [delSuccessId, setDelSuccessId] = useState<string | null>(null)

  const nextId = useMemo(
    () => getNextKddId(subsystemCode),
    [getNextKddId, subsystemCode, kdds],
  )

  const liveClassification = useMemo(
    () =>
      classifySpecRow({
        sheetName: `SPEC-${subsystemCode}`,
        name,
        type,
        classification,
        familyNumber: extractFamilyNumber(family),
      }),
    [subsystemCode, name, type, classification, family],
  )

  const peerOptions = useMemo(() => {
    if (relPeerSubsystem === 'ALL') return kdds
    return kdds.filter((k) => normalizeSubsystemCode(k.subsystemCode) === relPeerSubsystem)
  }, [kdds, relPeerSubsystem])

  const handleStageRelation = () => {
    setRelError(null)
    if (stagedRelations.length >= MAX_RELATIONS) {
      setRelError(`Limite maximale atteinte (${MAX_RELATIONS} relations par création).`)
      return
    }
    const peer = kdds.find((k) => k.id === relPeerId)
    if (!peer) {
      setRelError('Sélectionnez un KDD cible ou source.')
      return
    }

    const dedupeKey = `${relDirection}|${peer.id.toUpperCase()}`
    if (stagedRelations.some((r) => r.key === dedupeKey)) {
      setRelError(`Doublon détecté : une relation dans ce sens avec ${peer.id} est déjà ajoutée.`)
      return
    }

    const peerNorm = normalizeSubsystemCode(peer.subsystemCode, peer.subsystemLabel)
    const scope = peerNorm === subsystemCode ? 'Intra-sous-système' : 'Inter-sous-systèmes'

    setStagedRelations((prev) => [
      ...prev,
      {
        key: dedupeKey,
        direction: relDirection,
        peerId: peer.id,
        peerName: peer.name,
        peerSubsystem: peer.subsystemLabel || peer.subsystemCode,
        scope,
        nature: relNature.trim() || 'Dépendance fonctionnelle',
        influence: relInfluence.trim() || 'Influence',
        justification: relJustification.trim(),
        equation: relEquation.trim(),
        sourceRef: relSourceRef.trim(),
      },
    ])
    setRelJustification('')
    setRelEquation('')
  }

  const handleSaveKdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !definition.trim()) return

    const meta = getSubsystemMeta(subsystemCode)
    const subLabel = `${meta.code} — ${meta.frenchName}`

    const newRelations: NewRelationInput[] = stagedRelations.map((r) => {
      const isOut = r.direction === 'OUT'
      return {
        sourceId: isOut ? nextId : r.peerId,
        sourceName: isOut ? name.trim() : r.peerName,
        sourceSubsystem: isOut ? subLabel : r.peerSubsystem,
        targetId: isOut ? r.peerId : nextId,
        targetName: isOut ? r.peerName : name.trim(),
        targetSubsystem: isOut ? r.peerSubsystem : subLabel,
        nature: r.nature,
        influence: r.influence,
        justification: r.justification,
        equation: r.equation,
        requiredData: '',
        sourceRef: r.sourceRef,
        validationStatus:
          r.justification.length > 10 && r.equation.length > 2 && r.sourceRef.length > 2
            ? 'Validé'
            : 'Candidat — à valider',
        notes: '',
      }
    })

    const created = await addKddWithRelations(
      {
        id: nextId,
        subsystemCode,
        subsystemLabel: subLabel,
        specSheet: `SPEC-${subsystemCode}`,
        family,
        name: name.trim(),
        definition: definition.trim(),
        type,
        classification,
        level,
        importance: importance.trim(),
        techChoices: techChoices.trim(),
        locks: locks.trim(),
        lockNature: lockNature.trim(),
        specRef: `SPEC-${subsystemCode}`,
      },
      newRelations,
    )

    setSaveSuccess({ id: created.id, relCount: newRelations.length })
    setName('')
    setDefinition('')
    setImportance('')
    setTechChoices('')
    setLocks('')
    setLockNature('')
    setStagedRelations([])
  }

  // Delete search
  const deleteMatches = useMemo(() => {
    const q = delQuery.trim().toLowerCase()
    return kdds
      .filter((k) => {
        if (delSubFilter !== 'ALL' && normalizeSubsystemCode(k.subsystemCode) !== delSubFilter) {
          return false
        }
        if (!q) return true
        return (
          k.id.toLowerCase().includes(q) ||
          k.name.toLowerCase().includes(q) ||
          k.definition.toLowerCase().includes(q)
        )
      })
      .slice(0, 40)
  }, [kdds, delSubFilter, delQuery])

  const deleteTargetEgo = useMemo(
    () => (delSelectedId ? buildKddEgoGraph(kdds, relations, delSelectedId) : null),
    [kdds, relations, delSelectedId],
  )

  const handleConfirmDelete = async () => {
    if (!delSelectedId) return
    const deleted = delSelectedId
    await deleteKdd(deleted)
    setDelSelectedId('')
    setDelConfirmed(false)
    setDelSuccessId(deleted)
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] p-6 shadow-none">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-[var(--akdd-text-primary)]">
            KDD Manager — Gestion Dynamique Synchronisée
          </h1>
          <p className="text-xs text-[var(--akdd-text-secondary)]">
            Ajout atomique (DATA-KDDs + KDD - Relations + Bibliothèque) et suppression sécurisée
            préservant l’invariance des identifiants.
          </p>
        </div>

        <Tabs<ManagerTab>
          activeTab={activeTab}
          onChange={(t) => {
            setActiveTab(t)
            setSaveSuccess(null)
            setDelSuccessId(null)
          }}
          tabs={[
            { id: 'ADD', label: 'Ajouter un KDD', icon: <Plus className="h-4 w-4" /> },
            { id: 'DELETE', label: 'Supprimer un KDD', icon: <Trash2 className="h-4 w-4" /> },
          ]}
        />
      </div>

      {/* ===================== ADD KDD FLOW ===================== */}
      {activeTab === 'ADD' && (
        <form onSubmit={(e) => void handleSaveKdd(e)} className="flex flex-col gap-5">
          {saveSuccess && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--akdd-radius-md)] border border-[var(--akdd-status-kdd-border)] bg-[var(--akdd-status-kdd-bg)] px-4 py-3 text-sm text-[var(--akdd-status-kdd-text)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  KDD <strong className="font-mono">{saveSuccess.id}</strong> enregistré avec{' '}
                  <strong>{saveSuccess.relCount}</strong> relation(s) synchronisée(s) dans DATA-KDDs,
                  KDD - Relations et Bibliothèque.
                </span>
              </div>
              <Link
                to={`/explore/${encodeURIComponent(saveSuccess.id)}`}
                className="inline-flex items-center gap-1 text-xs font-semibold underline"
              >
                <Compass className="h-3.5 w-3.5" /> Explorer {saveSuccess.id}
              </Link>
            </div>
          )}

          {/* Section 1: KDD Metadata */}
          <Card>
            <CardHeader
              title="Section 1 — Informations du KDD"
              subtitle="L’identifiant suivant et le badge Statut KDD (Filtre) sont calculés en temps réel"
              action={
                <div className="flex items-center gap-2">
                  <span className="rounded-[var(--akdd-radius-sm)] bg-[var(--akdd-navy-900)] px-3 py-1 font-mono text-xs font-bold text-[var(--akdd-text-inverse)]">
                    ID auto : {nextId}
                  </span>
                  <StatutBadge statut={liveClassification.statut} />
                </div>
              }
            />
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Sous-système *
                </label>
                <select
                  value={subsystemCode}
                  onChange={(e) => setSubsystemCode(e.target.value as SubsystemCode)}
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-3 py-2 text-sm"
                >
                  {SUBSYSTEM_CATALOG.map((sub) => (
                    <option key={sub.code} value={sub.code}>
                      {sub.code} — {sub.frenchName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Famille fonctionnelle *
                </label>
                <select
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-3 py-2 text-sm"
                >
                  {FAMILIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Nom KDD *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Tip Clearance Active Control"
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Niveau *
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as 'Système' | 'Sous-Système')}
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-3 py-2 text-sm"
                >
                  <option value="Sous-Système">Sous-Système</option>
                  <option value="Système">Système</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-3 py-2 text-sm"
                >
                  {KDD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Classification (K / S / D)
                </label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value as KddClassification)}
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-3 py-2 text-sm"
                >
                  <option value="K">K — Key Design Driver</option>
                  <option value="S">S — Sizing Parameter</option>
                  <option value="D">D — Design Parameter</option>
                  <option value="">Aucune</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Nature du verrou
                </label>
                <input
                  type="text"
                  value={lockNature}
                  onChange={(e) => setLockNature(e.target.value)}
                  placeholder="Aéro, Méca, Thermique…"
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1 md:col-span-3">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Définition physique *
                </label>
                <textarea
                  required
                  rows={2}
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  placeholder="Décrivez précisément le paramètre physique et son périmètre…"
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Importance & Enjeux
                </label>
                <textarea
                  rows={2}
                  value={importance}
                  onChange={(e) => setImportance(e.target.value)}
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Choix Technologiques
                </label>
                <textarea
                  rows={2}
                  value={techChoices}
                  onChange={(e) => setTechChoices(e.target.value)}
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--akdd-text-secondary)]">
                  Verrous associés
                </label>
                <textarea
                  rows={2}
                  value={locks}
                  onChange={(e) => setLocks(e.target.value)}
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-3 py-2 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Dynamic Relation Builder */}
          <Card>
            <CardHeader
              title={`Section 2 — Relations associées (${stagedRelations.length} / ${MAX_RELATIONS})`}
              subtitle="Contrôle anti-doublon et détection automatique Intra / Inter-sous-systèmes"
            />
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-canvas)] p-4 border border-[var(--akdd-border-subtle)] md:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--akdd-text-secondary)]">
                    Filtrer sous-système
                  </label>
                  <select
                    value={relPeerSubsystem}
                    onChange={(e) => {
                      setRelPeerSubsystem(e.target.value)
                      setRelPeerId('')
                    }}
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2.5 py-1.5 text-xs"
                  >
                    <option value="ALL">Tous les sous-systèmes</option>
                    {SUBSYSTEM_CATALOG.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.frenchName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[11px] font-semibold text-[var(--akdd-text-secondary)]">
                    KDD lié
                  </label>
                  <select
                    value={relPeerId}
                    onChange={(e) => setRelPeerId(e.target.value)}
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2.5 py-1.5 text-xs"
                  >
                    <option value="">— Sélectionner un KDD —</option>
                    {peerOptions.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.selectionKey}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--akdd-text-secondary)]">
                    Sens de la relation
                  </label>
                  <button
                    type="button"
                    onClick={() => setRelDirection((d) => (d === 'OUT' ? 'IN' : 'OUT'))}
                    className="inline-flex items-center justify-center gap-1.5 rounded border border-[var(--akdd-navy-600)] bg-[var(--akdd-accent-blue-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--akdd-navy-900)] cursor-pointer"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    {relDirection === 'OUT' ? `${nextId} → Autre` : `Autre → ${nextId}`}
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--akdd-text-secondary)]">
                    Nature
                  </label>
                  <input
                    type="text"
                    value={relNature}
                    onChange={(e) => setRelNature(e.target.value)}
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--akdd-text-secondary)]">
                    Influence
                  </label>
                  <input
                    type="text"
                    value={relInfluence}
                    onChange={(e) => setRelInfluence(e.target.value)}
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--akdd-text-secondary)]">
                    Équation / Modèle
                  </label>
                  <input
                    type="text"
                    value={relEquation}
                    onChange={(e) => setRelEquation(e.target.value)}
                    placeholder="Ex. η = f(δ/h)"
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2.5 py-1.5 font-mono text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-[var(--akdd-text-secondary)]">
                    Référence (SOURCES_REL)
                  </label>
                  <select
                    value={relSourceRef}
                    onChange={(e) => setRelSourceRef(e.target.value)}
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2.5 py-1.5 text-xs"
                  >
                    <option value="">Aucune</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} — {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 md:col-span-3">
                  <label className="text-[11px] font-semibold text-[var(--akdd-text-secondary)]">
                    Justification physique
                  </label>
                  <input
                    type="text"
                    value={relJustification}
                    onChange={(e) => setRelJustification(e.target.value)}
                    placeholder="Expliquez le couplage physique…"
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={handleStageRelation}
                    className="w-full"
                  >
                    Ajouter à la liste
                  </Button>
                </div>
              </div>

              {relError && (
                <p className="text-xs font-medium text-[var(--akdd-status-contrainte-text)]">
                  {relError}
                </p>
              )}

              {stagedRelations.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {stagedRelations.map((r) => (
                    <div
                      key={r.key}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-3 py-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-[var(--akdd-navy-900)]">
                          {r.direction === 'OUT'
                            ? `${nextId} → ${r.peerId}`
                            : `${r.peerId} → ${nextId}`}
                        </span>
                        <span className="text-[var(--akdd-text-secondary)]">{r.peerName}</span>
                        <Badge className="bg-[var(--akdd-bg-subtle)] text-[var(--akdd-navy-800)] border-[var(--akdd-border-default)]">
                          {r.scope}
                        </Badge>
                        <span className="text-[var(--akdd-text-muted)]">{r.nature}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setStagedRelations((prev) => prev.filter((item) => item.key !== r.key))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-[var(--akdd-border-subtle)] pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                  disabled={!name.trim() || !definition.trim()}
                >
                  Enregistrer {nextId} et {stagedRelations.length} relation(s)
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* ===================== DELETE KDD FLOW ===================== */}
      {activeTab === 'DELETE' && (
        <div className="flex flex-col gap-5">
          {delSuccessId && (
            <div className="flex items-center gap-2 rounded-[var(--akdd-radius-md)] border border-[var(--akdd-status-kdd-border)] bg-[var(--akdd-status-kdd-bg)] px-4 py-3 text-sm text-[var(--akdd-status-kdd-text)]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                KDD <strong className="font-mono">{delSuccessId}</strong> et ses relations associées
                ont été supprimés. Tous les autres identifiants KDD restent strictement invariants.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Left: Search & Pick KDD */}
            <Card>
              <CardHeader
                title="Rechercher un KDD existant"
                subtitle="Filtrer par sous-système, identifiant ou nom"
              />
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={delSubFilter}
                    onChange={(e) => setDelSubFilter(e.target.value)}
                    className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5 text-xs"
                  >
                    <option value="ALL">Tous (10 sous-systèmes)</option>
                    {SUBSYSTEM_CATALOG.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.frenchName}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 text-[var(--akdd-text-muted)]" />
                    <input
                      type="text"
                      value={delQuery}
                      onChange={(e) => setDelQuery(e.target.value)}
                      placeholder="ID ou nom…"
                      className="flex-1 bg-transparent text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex max-h-[420px] flex-col overflow-y-auto rounded-[var(--akdd-radius-md)] border border-[var(--akdd-border-subtle)] divide-y divide-[var(--akdd-border-subtle)]">
                  {deleteMatches.map((k) => {
                    const isSelected = k.id === delSelectedId
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => {
                          setDelSelectedId(k.id)
                          setDelConfirmed(false)
                        }}
                        className={`flex items-center justify-between gap-2 px-3 py-2 text-left text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[var(--akdd-status-contrainte-bg)]'
                            : 'hover:bg-[var(--akdd-slate-50)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-[var(--akdd-navy-900)]">
                            {k.id}
                          </span>
                          <span className="truncate font-medium text-[var(--akdd-text-primary)]">
                            {k.name}
                          </span>
                        </div>
                        <StatutBadge statut={k.statutKdd} />
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Right: Impact Analysis & Confirmation */}
            <Card>
              <CardHeader
                title="Impact de la Suppression (Cascade Relations)"
                subtitle="Vérifiez les relations entrantes et sortantes avant confirmation"
              />
              <CardContent className="flex flex-col gap-4">
                {!deleteTargetEgo?.selectedKdd ? (
                  <p className="py-12 text-center text-xs text-[var(--akdd-text-muted)]">
                    Sélectionnez un KDD dans la liste à gauche pour inspecter ses relations liées.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-canvas)] p-3.5 border border-[var(--akdd-border-subtle)]">
                      <div className="flex flex-wrap items-center gap-2">
                        <SubsystemBadge code={deleteTargetEgo.selectedKdd.subsystemCode} />
                        <span className="font-mono text-sm font-bold text-[var(--akdd-navy-900)]">
                          {deleteTargetEgo.selectedKdd.id}
                        </span>
                        <StatutBadge statut={deleteTargetEgo.selectedKdd.statutKdd} />
                        <KsdBadge value={deleteTargetEgo.selectedKdd.classification} />
                      </div>
                      <p className="text-sm font-semibold text-[var(--akdd-text-primary)]">
                        {deleteTargetEgo.selectedKdd.name}
                      </p>
                      <p className="text-xs text-[var(--akdd-text-secondary)]">
                        {deleteTargetEgo.selectedKdd.definition}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-[var(--akdd-navy-900)]">
                        Relations qui seront supprimées en cascade (
                        {deleteTargetEgo.incoming.length} entrantes ·{' '}
                        {deleteTargetEgo.outgoing.length} sortantes) :
                      </span>
                      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-canvas)] p-2 text-xs">
                        {deleteTargetEgo.allLinks.length === 0 ? (
                          <span className="text-[var(--akdd-text-muted)] italic">
                            Aucune relation active associée.
                          </span>
                        ) : (
                          deleteTargetEgo.allLinks.map((item) => {
                            const isOut = item.direction === 'SORTANT'
                            return (
                              <div
                                key={`${item.relation.id}-${item.direction}`}
                                className="flex items-center justify-between gap-2 font-mono text-[11px]"
                              >
                                <span
                                  className={
                                    isOut
                                      ? 'text-[var(--akdd-dir-out-text)] font-semibold'
                                      : 'text-[var(--akdd-dir-in-text)] font-semibold'
                                  }
                                >
                                  [{isOut ? 'SORTANT →' : 'ENTRANT ←'}] {item.relation.sourceId} →{' '}
                                  {item.relation.targetId}
                                </span>
                                <span className="text-[var(--akdd-text-muted)]">
                                  {item.relation.id}
                                </span>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-[var(--akdd-radius-md)] border border-[var(--akdd-status-contrainte-border)] bg-[var(--akdd-status-contrainte-bg)] p-3 text-xs text-[var(--akdd-status-contrainte-text)]">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold">
                          Invariance des identifiants garantie (Guide §4.3)
                        </span>
                        <span>
                          La suppression retire uniquement {deleteTargetEgo.selectedKdd.id} et ses
                          relations liées. Aucun autre identifiant KDD ne sera renuméroté.
                        </span>
                        <label className="mt-1 inline-flex items-center gap-2 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={delConfirmed}
                            onChange={(e) => setDelConfirmed(e.target.checked)}
                          />
                          Je confirme la suppression de {deleteTargetEgo.selectedKdd.id}
                        </label>
                      </div>
                    </div>

                    <Button
                      variant="danger"
                      disabled={!delConfirmed}
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => void handleConfirmDelete()}
                    >
                      Supprimer définitivement {deleteTargetEgo.selectedKdd.id}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
