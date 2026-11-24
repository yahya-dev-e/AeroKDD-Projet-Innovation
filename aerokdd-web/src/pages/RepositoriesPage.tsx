import {
  BookOpen,
  ClipboardCheck,
  Database,
  ExternalLink,
  Library,
  Link2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
import { normalizeSubsystemCode } from '../engines/graphBuilder'
import { useAeroKddStore } from '../store/useAeroKddStore'
import type { RelationValidationStatus, SubsystemCode } from '../types/aerokdd'
import { SUBSYSTEM_CATALOG } from '../types/subsystems'

type RepoTab = 'kdds' | 'relations' | 'bibliotheque' | 'sources' | 'requirements'

const PAGE_SIZE = 40

const VALIDATION_OPTIONS: RelationValidationStatus[] = [
  'Validé',
  'A verifier (Revue manuelle)',
  'A verifier (Auto-relation)',
  'Candidat — à valider',
  'Rejeté',
]

export function RepositoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    kdds,
    relations,
    bibliotheque,
    sources,
    requirements,
    getNextRequirementId,
    updateRelationValidationStatus,
    addRequirement,
    updateRequirement,
    deleteRequirement,
  } = useAeroKddStore()

  const initialTab = (searchParams.get('tab') as RepoTab) || 'bibliotheque'
  const [activeTab, setActiveTab] = useState<RepoTab>(
    ['kdds', 'relations', 'bibliotheque', 'sources', 'requirements'].includes(initialTab)
      ? initialTab
      : 'bibliotheque',
  )

  const [query, setQuery] = useState('')
  const [subFilter, setSubFilter] = useState('ALL')
  const [relStatusFilter, setRelStatusFilter] = useState('ALL')
  const [maturityFilter, setMaturityFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  // New Requirement state
  const [reqSub, setReqSub] = useState<SubsystemCode>('FAN')
  const [reqKddId, setReqKddId] = useState('')
  const [reqText, setReqText] = useState('')
  const [reqCriteria, setReqCriteria] = useState('')
  const [reqUnit, setReqUnit] = useState('')
  const [reqMethod, setReqMethod] = useState('Simulation')
  const [reqOwner, setReqOwner] = useState('')

  useEffect(() => {
    const param = searchParams.get('tab') as RepoTab | null
    if (param && ['kdds', 'relations', 'bibliotheque', 'sources', 'requirements'].includes(param)) {
      setActiveTab(param)
    }
  }, [searchParams])

  useEffect(() => {
    setPage(1)
  }, [activeTab, query, subFilter, relStatusFilter, maturityFilter])

  const switchTab = (tab: RepoTab) => {
    setActiveTab(tab)
    setQuery('')
    setSubFilter('ALL')
    setSearchParams({ tab }, { replace: true })
  }

  // Filtered datasets
  const filteredKdds = useMemo(() => {
    const q = query.trim().toLowerCase()
    return kdds.filter((k) => {
      if (subFilter !== 'ALL' && normalizeSubsystemCode(k.subsystemCode) !== subFilter) return false
      if (!q) return true
      return (
        k.id.toLowerCase().includes(q) ||
        k.name.toLowerCase().includes(q) ||
        k.definition.toLowerCase().includes(q)
      )
    })
  }, [kdds, query, subFilter])

  const filteredRelations = useMemo(() => {
    const q = query.trim().toLowerCase()
    return relations.filter((r) => {
      if (relStatusFilter !== 'ALL') {
        const st = (r.validationStatus || '').toLowerCase()
        if (relStatusFilter === 'VALID' && !st.includes('validé')) return false
        if (relStatusFilter === 'REVIEW' && !st.includes('verifier') && !st.includes('vérifier'))
          return false
        if (relStatusFilter === 'CANDIDAT' && !st.includes('candidat')) return false
        if (relStatusFilter === 'REJET' && !st.includes('rejet')) return false
      }
      if (!q) return true
      return (
        r.id.toLowerCase().includes(q) ||
        r.sourceId.toLowerCase().includes(q) ||
        r.targetId.toLowerCase().includes(q) ||
        r.nature.toLowerCase().includes(q) ||
        r.justification.toLowerCase().includes(q)
      )
    })
  }, [relations, query, relStatusFilter])

  const filteredBib = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bibliotheque.filter((b) => {
      if (maturityFilter !== 'ALL' && !b.maturity.toUpperCase().startsWith(maturityFilter)) {
        return false
      }
      if (!q) return true
      return (
        b.id.toLowerCase().includes(q) ||
        b.sourceId.toLowerCase().includes(q) ||
        b.targetId.toLowerCase().includes(q) ||
        b.justification.toLowerCase().includes(q) ||
        b.scope.toLowerCase().includes(q)
      )
    })
  }, [bibliotheque, query, maturityFilter])

  const filteredSources = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sources
    return sources.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.organization.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.domains.toLowerCase().includes(q),
    )
  }, [sources, query])

  const reqSubKdds = useMemo(
    () => kdds.filter((k) => normalizeSubsystemCode(k.subsystemCode) === reqSub),
    [kdds, reqSub],
  )

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqText.trim()) return
    const kdd = reqSubKdds.find((k) => k.id === reqKddId)
    await addRequirement({
      level: 'Sous-Système',
      subsystemCode: reqSub,
      text: reqText.trim(),
      type: 'Performance',
      verificationMethod: reqMethod,
      acceptanceCriteria: reqCriteria.trim(),
      unit: reqUnit.trim(),
      source: 'Spécification Programme',
      kddId: kdd?.id ?? '',
      kddName: kdd?.name ?? '',
      status: 'Ouvert',
      proof: '',
      owner: reqOwner.trim(),
    })
    setReqText('')
    setReqCriteria('')
    setReqUnit('')
  }

  const renderPagination = (total: number) => {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-between border-t border-[var(--akdd-border-subtle)] px-4 py-2.5 text-xs text-[var(--akdd-text-secondary)]">
        <span className="font-mono tabular-nums">
          Page {page} / {totalPages} ({total} lignes)
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] p-6 shadow-none">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--akdd-text-primary)]">
            Référentiels Centraux & Instanciation Projet
          </h1>
          <p className="text-xs text-[var(--akdd-text-secondary)]">
            DATA-KDDs, Matrice active KDD - Relations, Bibliothèque E1–E4, Sources NASA et Registre
            d’Exigences (Requirements).
          </p>
        </div>

        <Tabs<RepoTab>
          activeTab={activeTab}
          onChange={switchTab}
          tabs={[
            {
              id: 'kdds',
              label: 'DATA-KDDs',
              badge: kdds.length,
              icon: <Database className="h-3.5 w-3.5" />,
            },
            {
              id: 'relations',
              label: 'Relations',
              badge: relations.length,
              icon: <Link2 className="h-3.5 w-3.5" />,
            },
            {
              id: 'bibliotheque',
              label: 'Bibliothèque',
              badge: bibliotheque.length,
              icon: <Library className="h-3.5 w-3.5" />,
            },
            {
              id: 'sources',
              label: 'Sources NASA',
              badge: sources.length,
              icon: <BookOpen className="h-3.5 w-3.5" />,
            },
            {
              id: 'requirements',
              label: 'Requirements',
              badge: requirements.length,
              icon: <ClipboardCheck className="h-3.5 w-3.5" />,
            },
          ]}
        />
      </div>

      {/* ===================== DATA-KDDs ===================== */}
      {activeTab === 'kdds' && (
        <Card>
          <CardHeader
            title={`DATA-KDDs (${filteredKdds.length})`}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={subFilter}
                  onChange={(e) => setSubFilter(e.target.value)}
                  className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5 text-xs"
                >
                  <option value="ALL">Tous les sous-systèmes</option>
                  {SUBSYSTEM_CATALOG.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5">
                  <Search className="h-3.5 w-3.5 text-[var(--akdd-text-muted)]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher…"
                    className="bg-transparent text-xs focus:outline-none"
                  />
                </div>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#71717A]">
                  <th className="px-4 py-3 w-[124px]">ID</th>
                  <th className="px-4 py-3 w-[115px]">Sous-Sys.</th>
                  <th className="px-4 py-3">Nom KDD</th>
                  <th className="px-4 py-3 w-[180px]">Type</th>
                  <th className="px-4 py-3 w-[84px] text-center">K/S/D</th>
                  <th className="px-4 py-3 w-[230px]">Statut KDD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--akdd-border-subtle)]">
                {filteredKdds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((k) => (
                  <tr key={k.id} className="hover:bg-[var(--akdd-bg-subtle)] transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium tabular-nums whitespace-nowrap">
                      <Link
                        to={`/explore/${encodeURIComponent(k.id)}`}
                        className="text-[var(--akdd-ink)] hover:underline"
                      >
                        {k.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <SubsystemBadge code={k.subsystemCode} />
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-medium text-[var(--akdd-text-primary)]">
                      {k.name}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--akdd-text-secondary)]">{k.type}</td>
                    <td className="px-4 py-3.5 text-center">
                      <KsdBadge value={k.classification} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatutBadge statut={k.statutKdd} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination(filteredKdds.length)}
        </Card>
      )}

      {/* ===================== KDD - RELATIONS ===================== */}
      {activeTab === 'relations' && (
        <Card>
          <CardHeader
            title={`Matrice Active KDD - Relations (${filteredRelations.length})`}
            subtitle="Modifiez directement le statut de validation en ligne"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={relStatusFilter}
                  onChange={(e) => setRelStatusFilter(e.target.value)}
                  className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5 text-xs"
                >
                  <option value="ALL">Tous statuts</option>
                  <option value="VALID">Validé</option>
                  <option value="REVIEW">À vérifier</option>
                  <option value="CANDIDAT">Candidat</option>
                  <option value="REJET">Rejeté</option>
                </select>
                <div className="flex items-center gap-1.5 rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5">
                  <Search className="h-3.5 w-3.5 text-[var(--akdd-text-muted)]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Source, cible, nature…"
                    className="bg-transparent text-xs focus:outline-none"
                  />
                </div>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#71717A]">
                  <th className="px-4 py-3 w-[95px]">ID</th>
                  <th className="px-4 py-3">Source → Cible</th>
                  <th className="px-4 py-3">Nature</th>
                  <th className="px-4 py-3">Justification &amp; Équation</th>
                  <th className="px-4 py-3">Ref.</th>
                  <th className="px-4 py-3 w-[210px]">Statut Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--akdd-border-subtle)]">
                {filteredRelations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--akdd-bg-subtle)] transition-colors">
                    <td className="px-4 py-3.5 font-mono tabular-nums text-[var(--akdd-text-muted)] whitespace-nowrap">
                      {r.id}
                    </td>
                    <td className="px-4 py-3.5 font-mono tabular-nums whitespace-nowrap">
                      <Link
                        to={`/explore/${encodeURIComponent(r.sourceId)}`}
                        className="font-medium text-[var(--akdd-ink)] hover:underline"
                      >
                        {r.sourceId}
                      </Link>{' '}
                      <span className="text-[var(--akdd-text-muted)]">→</span>{' '}
                      <Link
                        to={`/explore/${encodeURIComponent(r.targetId)}`}
                        className="font-medium text-[var(--akdd-ink)] hover:underline"
                      >
                        {r.targetId}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--akdd-text-primary)]">{r.nature}</td>
                    <td className="px-4 py-3.5 max-w-md text-[var(--akdd-text-secondary)]">
                      <p className="line-clamp-2">{r.justification}</p>
                      {r.equation && (
                        <code className="font-mono text-[10px] text-[var(--akdd-navy-700)]">
                          {r.equation}
                        </code>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px]">{r.sourceRef || '—'}</td>
                    <td className="px-4 py-3.5">
                      <select
                        value={r.validationStatus}
                        onChange={(e) =>
                          void updateRelationValidationStatus(
                            r.id,
                            e.target.value as RelationValidationStatus,
                          )
                        }
                        className="w-full rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2 py-1 text-xs font-medium"
                      >
                        {VALIDATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination(filteredRelations.length)}
        </Card>
      )}

      {/* ===================== BIBLIOTHEQUE ===================== */}
      {activeTab === 'bibliotheque' && (
        <Card>
          <CardHeader
            title={`BIBLIOTHEQUE DES RELATIONS-KDD (${filteredBib.length})`}
            subtitle="Filtrer par niveau de maturité scientifique (E1–E3 actifs, E4 hypothèses en revue)"
            action={
              <div className="flex flex-wrap items-center gap-2">
                {['ALL', 'E1', 'E2', 'E3', 'E4'].map((mat) => (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => setMaturityFilter(mat)}
                    className={`rounded-full px-2.5 py-1 text-xs font-mono font-medium border cursor-pointer ${
                      maturityFilter === mat
                        ? 'bg-[var(--akdd-navy-700)] text-[var(--akdd-text-inverse)] border-[var(--akdd-navy-700)]'
                        : 'bg-[var(--akdd-bg-canvas)] text-[var(--akdd-text-secondary)] border-[var(--akdd-border-subtle)]'
                    }`}
                  >
                    {mat === 'ALL' ? 'Toutes' : mat}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1">
                  <Search className="h-3.5 w-3.5 text-[var(--akdd-text-muted)]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher…"
                    className="bg-transparent text-xs focus:outline-none"
                  />
                </div>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#71717A]">
                  <th className="px-4 py-3 w-[95px]">ID</th>
                  <th className="px-4 py-3">Source → Cible</th>
                  <th className="px-4 py-3">Portée</th>
                  <th className="px-4 py-3">Maturité</th>
                  <th className="px-4 py-3">Justification</th>
                  <th className="px-4 py-3">Notes / Revue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--akdd-border-subtle)]">
                {filteredBib.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((b, i) => (
                  <tr key={`${b.id}-${i}`} className="hover:bg-[var(--akdd-bg-subtle)] transition-colors">
                    <td className="px-4 py-3.5 font-mono tabular-nums text-[var(--akdd-text-muted)] whitespace-nowrap">
                      {b.id}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono font-medium tabular-nums text-[var(--akdd-ink)]">
                      {b.sourceId} → {b.targetId}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge className="bg-[var(--akdd-bg-subtle)] text-[var(--akdd-navy-800)] border-[var(--akdd-border-default)]">
                        {b.scope || '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        className={
                          b.maturity.startsWith('E4')
                            ? 'bg-[var(--akdd-status-effet-bg)] text-[var(--akdd-status-effet-text)] border-[var(--akdd-status-effet-border)] font-mono'
                            : 'bg-[var(--akdd-status-kdd-bg)] text-[var(--akdd-status-kdd-text)] border-[var(--akdd-status-kdd-border)] font-mono'
                        }
                      >
                        {b.maturity || '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 max-w-md text-[var(--akdd-text-secondary)]">
                      <p className="line-clamp-2">{b.justification}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--akdd-text-muted)]">
                      {b.notes || b.reviewAction || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination(filteredBib.length)}
        </Card>
      )}

      {/* ===================== SOURCES_REL ===================== */}
      {activeTab === 'sources' && (
        <Card>
          <CardHeader
            title={`Référentiel Bibliographique SOURCES_REL (${filteredSources.length})`}
            subtitle="Publications NASA Glenn, NASA NTRS et NACA appuyant les principes physiques"
            action={
              <div className="flex items-center gap-1.5 rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5">
                <Search className="h-3.5 w-3.5 text-[var(--akdd-text-muted)]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filtrer par titre, domaine…"
                  className="bg-transparent text-xs focus:outline-none"
                />
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#71717A]">
                  <th className="px-4 py-3 w-[95px]">ID</th>
                  <th className="px-4 py-3 w-[150px]">Organisme</th>
                  <th className="px-4 py-3 min-w-[220px]">Titre &amp; Lien</th>
                  <th className="px-4 py-3 min-w-[240px]">Domaines d’appui</th>
                  <th className="px-4 py-3 min-w-[220px]">Portée / Limites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--akdd-border-subtle)]">
                {filteredSources.map((s) => (
                  <tr key={s.id} className="align-top hover:bg-[var(--akdd-bg-subtle)] transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium tabular-nums text-[var(--akdd-ink)]">
                      {s.id}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--akdd-text-primary)]">
                      {s.organization}
                    </td>
                    <td className="px-4 py-3.5">
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-start gap-1.5 font-medium text-[var(--akdd-ink)] hover:underline"
                        >
                          <span>{s.title}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        </a>
                      ) : (
                        <span className="font-medium text-[var(--akdd-text-primary)]">
                          {s.title}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 leading-relaxed text-[var(--akdd-text-secondary)]">
                      {s.domains}
                    </td>
                    <td className="px-4 py-3.5 leading-relaxed text-[var(--akdd-text-muted)]">
                      {s.scopeLimits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ===================== REQUIREMENTS ===================== */}
      {activeTab === 'requirements' && (
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader
              title="Instanciation Programme — Ajouter une Exigence (Requirements)"
              subtitle="Les identifiants REQ-xxx sont générés automatiquement et alimentent les compteurs TDB-*"
              action={
                <span className="rounded-[var(--akdd-radius-xs)] bg-[var(--akdd-ink)] px-2.5 py-1 font-mono text-xs font-medium tabular-nums text-[var(--akdd-text-inverse)]">
                  Prochain ID : {getNextRequirementId()}
                </span>
              }
            />
            <CardContent>
              <form
                onSubmit={(e) => void handleAddRequirement(e)}
                className="grid grid-cols-1 gap-3 md:grid-cols-4"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--akdd-text-secondary)]">
                    Sous-système
                  </label>
                  <select
                    value={reqSub}
                    onChange={(e) => {
                      setReqSub(e.target.value as SubsystemCode)
                      setReqKddId('')
                    }}
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5 text-xs"
                  >
                    {SUBSYSTEM_CATALOG.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.frenchName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-[var(--akdd-text-secondary)]">
                    ID KDD associé (met à jour TDB-{reqSub})
                  </label>
                  <select
                    value={reqKddId}
                    onChange={(e) => setReqKddId(e.target.value)}
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5 text-xs"
                  >
                    <option value="">— Sélectionner un KDD —</option>
                    {reqSubKdds.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.selectionKey}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--akdd-text-secondary)]">
                    Méthode de vérification
                  </label>
                  <select
                    value={reqMethod}
                    onChange={(e) => setReqMethod(e.target.value)}
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5 text-xs"
                  >
                    <option value="Simulation">Simulation</option>
                    <option value="Essai">Essai</option>
                    <option value="Analyse">Analyse</option>
                    <option value="Inspection">Inspection</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-[var(--akdd-text-secondary)]">
                    Texte de l’exigence *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqText}
                    onChange={(e) => setReqText(e.target.value)}
                    placeholder="Ex. Le niveau acoustique du FAN au décollage doit rester inférieur à…"
                    className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--akdd-text-secondary)]">
                    Critère d’acceptation & Unité
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={reqCriteria}
                      onChange={(e) => setReqCriteria(e.target.value)}
                      placeholder="≤ 85"
                      className="w-2/3 rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={reqUnit}
                      onChange={(e) => setReqUnit(e.target.value)}
                      placeholder="EPNdB"
                      className="w-1/3 rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <input
                    type="text"
                    value={reqOwner}
                    onChange={(e) => setReqOwner(e.target.value)}
                    placeholder="Responsable…"
                    className="flex-1 rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2.5 py-1.5 text-xs"
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                    Ajouter
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={`Registre des Exigences (${requirements.length})`} />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#71717A]">
                    <th className="px-4 py-3">ID Req.</th>
                    <th className="px-4 py-3">Sous-Sys.</th>
                    <th className="px-4 py-3">Exigence</th>
                    <th className="px-4 py-3">Critère</th>
                    <th className="px-4 py-3">KDD Associé</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 w-[44px]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--akdd-border-subtle)]">
                  {requirements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-[var(--akdd-text-muted)]"
                      >
                        Registre vierge : ajoutez votre première exigence programme ci-dessus.
                      </td>
                    </tr>
                  ) : (
                    requirements.map((req) => (
                      <tr key={req.id} className="hover:bg-[var(--akdd-bg-subtle)] transition-colors">
                        <td className="px-4 py-3.5 font-mono font-medium tabular-nums text-[var(--akdd-ink)]">
                          {req.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <SubsystemBadge code={req.subsystemCode} />
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[var(--akdd-text-primary)]">
                          {req.text}
                        </td>
                        <td className="px-4 py-3.5 font-mono tabular-nums">
                          {req.acceptanceCriteria} {req.unit}
                        </td>
                        <td className="px-4 py-3.5">
                          {req.kddId ? (
                            <Link
                              to={`/explore/${encodeURIComponent(req.kddId)}`}
                              className="font-mono font-medium text-[var(--akdd-ink)] hover:underline"
                            >
                              {req.kddId} · {req.kddName}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            value={req.status}
                            onChange={(e) =>
                              void updateRequirement(req.id, { status: e.target.value })
                            }
                            className="rounded border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] px-2 py-1 text-xs"
                          >
                            <option value="Ouvert">Ouvert</option>
                            <option value="En cours">En cours</option>
                            <option value="Vérifié">Vérifié</option>
                            <option value="Validé">Validé</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => void deleteRequirement(req.id)}
                            aria-label={`Supprimer ${req.id}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--akdd-text-muted)] hover:bg-[var(--akdd-status-contrainte-bg)] hover:text-[var(--akdd-status-contrainte-text)] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
