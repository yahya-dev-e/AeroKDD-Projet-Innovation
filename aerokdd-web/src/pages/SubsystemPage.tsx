import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Compass,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  FamilyBarChart,
  KsdDonutChart,
  StatutHorizontalBarChart,
  type ChartDatum,
} from '../components/graphs'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Drawer,
  KpiCard,
  KsdBadge,
  StatutBadge,
  SubsystemBadge,
  Tabs,
} from '../components/ui'
import { extractFamilyNumber } from '../engines/classifier'
import { buildKddEgoGraph, normalizeSubsystemCode } from '../engines/graphBuilder'
import { useAeroKddStore } from '../store/useAeroKddStore'
import type { KDD } from '../types/aerokdd'
import { getSubsystemMeta, SUBSYSTEM_CATALOG } from '../types/subsystems'

type SubsystemTab = 'SPEC' | 'TDB' | 'TRACA'

const STATUS_FILTER_OPTIONS = [
  { id: 'ALL', label: 'Tous' },
  { id: 'KDD', label: 'KDD' },
  { id: 'S', label: 'S - Sizing' },
  { id: 'D', label: 'D - Design' },
  { id: 'PRESTATION', label: 'Prestation' },
  { id: 'EFFET', label: 'Effet Induit' },
  { id: 'INPUT', label: 'Input / Interface' },
  { id: 'CONTRAINTE', label: 'Contrainte / RAMS' },
] as const

type StatusFilterId = (typeof STATUS_FILTER_OPTIONS)[number]['id']

function matchesStatusFilter(statut: string, filter: StatusFilterId): boolean {
  if (filter === 'ALL') return true
  const s = (statut || '').toUpperCase()
  switch (filter) {
    case 'KDD':
      return s.startsWith('KDD')
    case 'S':
      return s.startsWith('S -')
    case 'D':
      return s.startsWith('D -')
    case 'PRESTATION':
      return s.startsWith('PRESTATION')
    case 'EFFET':
      return s.startsWith('EFFET INDUIT')
    case 'INPUT':
      return s.startsWith('INPUT')
    case 'CONTRAINTE':
      return s.startsWith('CONTRAINT')
  }
}

export function SubsystemPage() {
  const { code = 'FAN' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const subsystemCode = normalizeSubsystemCode(code)
  const meta = getSubsystemMeta(subsystemCode)

  const {
    kdds,
    relations,
    requirements,
    tracaEntries,
    addTracaEntry,
    updateTracaEntry,
    deleteTracaEntry,
  } = useAeroKddStore()

  const [activeTab, setActiveTab] = useState<SubsystemTab>('SPEC')
  const [specSearch, setSpecSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterId>('ALL')
  const [collapsedFamilies, setCollapsedFamilies] = useState<Record<string, boolean>>({})
  const [drawerKdd, setDrawerKdd] = useState<KDD | null>(null)
  const [inspectorKddId, setInspectorKddId] = useState<string>('')

  const subsystemKdds = useMemo(
    () =>
      kdds.filter(
        (k) => normalizeSubsystemCode(k.subsystemCode, k.subsystemLabel) === subsystemCode,
      ),
    [kdds, subsystemCode],
  )

  const subsystemRequirements = useMemo(
    () =>
      requirements.filter((r) => normalizeSubsystemCode(r.subsystemCode) === subsystemCode),
    [requirements, subsystemCode],
  )

  const subsystemTraca = useMemo(
    () =>
      tracaEntries.filter((t) => normalizeSubsystemCode(t.subsystemCode) === subsystemCode),
    [tracaEntries, subsystemCode],
  )

  // Open drawer if ?kdd=ID query param is present (e.g. from Cmd+K CommandPalette)
  useEffect(() => {
    const kddParam = searchParams.get('kdd')
    if (kddParam) {
      const found = subsystemKdds.find((k) => k.id.toUpperCase() === kddParam.toUpperCase())
      if (found) {
        setDrawerKdd(found)
        setInspectorKddId(found.id)
      }
    }
  }, [searchParams, subsystemKdds])

  // Reset default inspector selection when switching subsystem
  useEffect(() => {
    if (subsystemKdds.length === 0) return
    const exists = subsystemKdds.some((k) => k.id === inspectorKddId)
    if (!exists) {
      const preferred =
        subsystemKdds.find((k) => k.id === 'FAN-032') ??
        subsystemKdds.find((k) => k.statutKdd.startsWith('KDD')) ??
        subsystemKdds[0]
      setInspectorKddId(preferred.id)
    }
  }, [subsystemKdds, inspectorKddId])

  // --- SPEC Tab Data ---
  const filteredSpecKdds = useMemo(() => {
    const q = specSearch.trim().toLowerCase()
    return subsystemKdds.filter((k) => {
      if (!matchesStatusFilter(k.statutKdd, statusFilter)) return false
      if (!q) return true
      return (
        k.id.toLowerCase().includes(q) ||
        k.name.toLowerCase().includes(q) ||
        k.definition.toLowerCase().includes(q) ||
        k.type.toLowerCase().includes(q)
      )
    })
  }, [subsystemKdds, specSearch, statusFilter])

  const familyGroups = useMemo(() => {
    const map = new Map<string, KDD[]>()
    for (const k of filteredSpecKdds) {
      const fam = k.family || 'Autres éléments'
      const list = map.get(fam)
      if (list) list.push(k)
      else map.set(fam, [k])
    }
    return Array.from(map.entries()).sort(
      ([famA], [famB]) => extractFamilyNumber(famA) - extractFamilyNumber(famB),
    )
  }, [filteredSpecKdds])

  const drawerEgo = useMemo(
    () => (drawerKdd ? buildKddEgoGraph(kdds, relations, drawerKdd.id) : null),
    [drawerKdd, kdds, relations],
  )

  // --- TDB Tab Data ---
  const tdbMetrics = useMemo(() => {
    let kCount = 0
    let sCount = 0
    let dCount = 0
    const famCounts = [0, 0, 0, 0, 0]
    const statutMap = new Map<string, number>()

    const idSet = new Set(subsystemKdds.map((k) => k.id.toUpperCase()))

    for (const k of subsystemKdds) {
      if (k.statutKdd.startsWith('KDD')) kCount += 1
      else if (k.statutKdd.startsWith('S -')) sCount += 1
      else if (k.statutKdd.startsWith('D -')) dCount += 1

      const fNum = extractFamilyNumber(k.family)
      if (fNum >= 1 && fNum <= 5) famCounts[fNum - 1] += 1

      const st = k.statutKdd || 'Non classé'
      statutMap.set(st, (statutMap.get(st) ?? 0) + 1)
    }

    let linkOccurrences = 0
    for (const rel of relations) {
      const s = rel.sourceId.toUpperCase()
      const t = rel.targetId.toUpperCase()
      if (idSet.has(s)) linkOccurrences += 1
      if (idSet.has(t)) linkOccurrences += 1
    }

    const ksdChartData: ChartDatum[] = [
      { name: 'KDD (K)', value: kCount, color: '#09090B' },
      { name: 'Sizing (S)', value: sCount, color: '#52525B' },
      { name: 'Design (D)', value: dCount, color: '#D4D4D8' },
    ]

    const familyChartData: ChartDatum[] = famCounts.map((count, i) => ({
      name: `F${i + 1}`,
      value: count,
      color: '#09090B',
    }))

    const statutColor = (name: string): string => {
      const u = name.toUpperCase()
      if (u.startsWith('KDD')) return '#15803D'
      if (u.startsWith('S -')) return '#1D4ED8'
      if (u.startsWith('D -')) return '#52525B'
      if (u.startsWith('EFFET')) return '#C2410C'
      if (u.startsWith('PREST')) return '#B45309'
      if (u.startsWith('INPUT')) return '#D4D4D8'
      if (u.startsWith('CONTRAINT')) return '#BE123C'
      return '#71717A'
    }

    const statutChartData: ChartDatum[] = Array.from(statutMap.entries())
      .map(([name, value]) => ({ name, value, color: statutColor(name) }))
      .sort((a, b) => b.value - a.value)

    return {
      kCount,
      sCount,
      dCount,
      linkOccurrences,
      ksdChartData,
      familyChartData,
      statutChartData,
    }
  }, [subsystemKdds, relations])

  const inspectedKdd = useMemo(
    () => subsystemKdds.find((k) => k.id === inspectorKddId) ?? subsystemKdds[0] ?? null,
    [subsystemKdds, inspectorKddId],
  )

  const inspectedEgo = useMemo(
    () => (inspectedKdd ? buildKddEgoGraph(kdds, relations, inspectedKdd.id) : null),
    [inspectedKdd, kdds, relations],
  )

  const toggleFamily = (family: string) => {
    setCollapsedFamilies((prev) => ({ ...prev, [family]: !prev[family] }))
  }

  const handleAddTracaRow = async () => {
    const defaultKdd = subsystemKdds[0]
    await addTracaEntry({
      subsystemCode,
      systemElement: '',
      systemFunction: '',
      requirementId: subsystemRequirements[0]?.id ?? '',
      kddId: defaultKdd?.id ?? '',
      kddName: defaultKdd?.name ?? '',
      verificationMethod: 'Analyse',
      proof: '',
      status: 'En cours',
      owner: '',
      notes: '',
    })
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7">
      {/* Subsystem Header & Module Switcher */}
      <div className="flex flex-col gap-4 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] p-6 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SubsystemBadge code={meta.code} />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-[var(--akdd-text-primary)]">
                {meta.code} — {meta.frenchName}
              </h1>
              <p className="text-xs text-[var(--akdd-text-secondary)]">{meta.shortRole}</p>
            </div>
          </div>

          <Tabs<SubsystemTab>
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              {
                id: 'SPEC',
                label: `SPEC-${meta.code}`,
                badge: subsystemKdds.length,
                icon: <FileSpreadsheet className="h-4 w-4" />,
              },
              {
                id: 'TDB',
                label: `TDB-${meta.code}`,
                icon: <BarChart3 className="h-4 w-4" />,
              },
              {
                id: 'TRACA',
                label: `TRACA SYS-${meta.code}`,
                badge: subsystemTraca.length,
                icon: <ClipboardList className="h-4 w-4" />,
              },
            ]}
          />
        </div>

        {/* Quick 10-subsystem pill switcher */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--akdd-border-subtle)] pt-3">
          {SUBSYSTEM_CATALOG.map((sub) => {
            const isCurrent = sub.code === subsystemCode
            return (
              <button
                key={sub.code}
                type="button"
                onClick={() => navigate(`/subsystems/${sub.code}`)}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] font-medium transition-colors shadow-none cursor-pointer ${
                  isCurrent
                    ? 'border-[var(--akdd-ink)] bg-[var(--akdd-ink)] text-[var(--akdd-text-inverse)]'
                    : 'border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] text-[var(--akdd-text-secondary)] hover:border-[var(--akdd-ink)] hover:text-[var(--akdd-ink)]'
                }`}
              >
                {sub.code}
              </button>
            )
          })}
        </div>
      </div>

      {/* ===================== TAB 1: SPEC ===================== */}
      {activeTab === 'SPEC' && (
        <div className="flex flex-col gap-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col gap-3 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] p-5 shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-full border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-subtle)] px-4 py-2">
                <Search className="h-4 w-4 shrink-0 text-[var(--akdd-text-muted)]" />
                <input
                  type="text"
                  value={specSearch}
                  onChange={(e) => setSpecSearch(e.target.value)}
                  placeholder={`Filtrer dans SPEC-${meta.code} (ID, nom, définition)…`}
                  className="flex-1 bg-transparent text-sm text-[var(--akdd-text-primary)] placeholder:text-[var(--akdd-text-muted)] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--akdd-text-muted)]">
                <span className="font-mono">
                  {filteredSpecKdds.length} / {subsystemKdds.length} éléments
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCollapsedFamilies({})}
                >
                  Tout déplier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next: Record<string, boolean> = {}
                    for (const [fam] of familyGroups) next[fam] = true
                    setCollapsedFamilies(next)
                  }}
                >
                  Tout replier
                </Button>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_FILTER_OPTIONS.map((opt) => {
                const isActive = statusFilter === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatusFilter(opt.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[var(--akdd-navy-700)] text-[var(--akdd-text-inverse)] border-[var(--akdd-navy-700)]'
                        : 'bg-[var(--akdd-bg-canvas)] text-[var(--akdd-text-secondary)] border-[var(--akdd-border-subtle)] hover:border-[var(--akdd-navy-600)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Collapsible Family Sections (F1–F5) */}
          {familyGroups.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-[var(--akdd-text-muted)]">
                Aucun élément ne correspond à ces critères dans SPEC-{meta.code}.
              </CardContent>
            </Card>
          ) : (
            familyGroups.map(([family, items]) => {
              const isCollapsed = !!collapsedFamilies[family]
              return (
                <Card key={family} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFamily(family)}
                    className="flex w-full items-center justify-between gap-3 bg-[var(--akdd-bg-subtle)] px-5 py-3 text-left border-b border-[var(--akdd-border-subtle)] hover:bg-[var(--akdd-slate-100)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--akdd-navy-700)]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--akdd-navy-700)]" />
                      )}
                      <span className="text-sm font-semibold text-[var(--akdd-navy-900)] truncate">
                        {family}
                      </span>
                    </div>
                    <Badge className="bg-[var(--akdd-bg-surface)] text-[var(--akdd-navy-800)] border-[var(--akdd-border-default)] font-mono">
                      {items.length} élément{items.length > 1 ? 's' : ''}
                    </Badge>
                  </button>

                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#71717A]">
                            <th className="px-4 py-3 w-[124px]">ID KDD</th>
                            <th className="px-4 py-3">Nom KDD</th>
                            <th className="px-4 py-3 w-[180px]">Type</th>
                            <th className="px-4 py-3 w-[84px] text-center">Class.</th>
                            <th className="px-4 py-3 w-[124px]">Niveau</th>
                            <th className="px-4 py-3 w-[230px]">Statut KDD</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--akdd-border-subtle)]">
                          {items.map((kdd) => (
                            <tr
                              key={kdd.id}
                              onClick={() => setDrawerKdd(kdd)}
                              className="hover:bg-[var(--akdd-bg-subtle)] transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3.5 font-mono text-xs font-semibold tabular-nums text-[var(--akdd-ink)] whitespace-nowrap">
                                {kdd.id}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[13px] font-medium text-[var(--akdd-text-primary)]">
                                    {kdd.name}
                                  </span>
                                  <span className="text-xs text-[var(--akdd-text-muted)] line-clamp-1">
                                    {kdd.definition}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-xs text-[var(--akdd-text-secondary)]">
                                {kdd.type}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <KsdBadge value={kdd.classification} />
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs text-[var(--akdd-text-secondary)] whitespace-nowrap">
                                {kdd.level}
                              </td>
                              <td className="px-4 py-3.5">
                                <StatutBadge statut={kdd.statutKdd} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* ===================== TAB 2: TDB ===================== */}
      {activeTab === 'TDB' && (
        <div className="flex flex-col gap-5">
          {/* KPI Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              label="Total Éléments"
              value={subsystemKdds.length}
              subtitle={`SPEC-${meta.code}`}
              accentClassName="border-l-[var(--akdd-navy-700)]"
            />
            <KpiCard
              label="KDD (Key Drivers)"
              value={tdbMetrics.kCount}
              subtitle="Leviers architecturaux majeurs"
              accentClassName="border-l-[var(--akdd-status-kdd-border)]"
            />
            <KpiCard
              label="S (Sizing)"
              value={tdbMetrics.sCount}
              subtitle="Paramètres de dimensionnement"
              accentClassName="border-l-[var(--akdd-status-s-border)]"
            />
            <KpiCard
              label="D (Design)"
              value={tdbMetrics.dCount}
              subtitle="Paramètres de conception"
              accentClassName="border-l-[var(--akdd-status-d-border)]"
            />
            <KpiCard
              label="Occurrences de Liens"
              value={tdbMetrics.linkOccurrences}
              subtitle={`${subsystemRequirements.length} exigence(s) associée(s)`}
              accentClassName="border-l-[var(--akdd-edge-topdown)]"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Répartition des Leviers (K / S / D)"
                subtitle="Proportion Key Design Drivers, Sizing et Design Parameters"
              />
              <CardContent>
                <KsdDonutChart data={tdbMetrics.ksdChartData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Répartition par Famille (F1 – F5)"
                subtitle="Couverture fonctionnelle du référentiel générique"
              />
              <CardContent>
                <FamilyBarChart data={tdbMetrics.familyChartData} />
              </CardContent>
            </Card>
          </div>

          {/* Horizontal Statut KDD Bar Chart */}
          <Card>
            <CardHeader
              title="Répartition par Statut KDD (Filtre SPEC)"
              subtitle="Ventilation complète selon les règles métier mod_Admin_FiltreSPEC"
            />
            <CardContent>
              <StatutHorizontalBarChart data={tdbMetrics.statutChartData} />
            </CardContent>
          </Card>

          {/* Unit KDD Inspector */}
          <Card>
            <CardHeader
              title="Explorateur Unitaire de KDD"
              subtitle="Sélectionnez un identifiant pour consulter sa fiche complète et ses couplages"
              action={
                <select
                  aria-label="Sélectionner un KDD à inspecter"
                  value={inspectedKdd?.id ?? ''}
                  onChange={(e) => setInspectorKddId(e.target.value)}
                  className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-3 py-1.5 text-xs font-medium text-[var(--akdd-text-primary)] focus:outline-none focus:border-[var(--akdd-navy-600)] max-w-[320px]"
                >
                  {subsystemKdds.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.selectionKey}
                    </option>
                  ))}
                </select>
              }
            />
            {inspectedKdd && inspectedEgo && (
              <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left 2 cols: Specification Sheet */}
                <div className="flex flex-col gap-4 lg:col-span-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-bold text-[var(--akdd-navy-900)]">
                      {inspectedKdd.id}
                    </span>
                    <span className="text-base font-semibold text-[var(--akdd-text-primary)]">
                      {inspectedKdd.name}
                    </span>
                    <StatutBadge statut={inspectedKdd.statutKdd} />
                    <KsdBadge value={inspectedKdd.classification} />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-canvas)] p-3.5 border border-[var(--akdd-border-subtle)]">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
                        Définition
                      </span>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--akdd-text-primary)]">
                        {inspectedKdd.definition || '—'}
                      </p>
                    </div>
                    <div className="rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-canvas)] p-3.5 border border-[var(--akdd-border-subtle)]">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
                        Importance & Impact
                      </span>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--akdd-text-primary)]">
                        {inspectedKdd.importance || '—'}
                      </p>
                    </div>
                    <div className="rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-canvas)] p-3.5 border border-[var(--akdd-border-subtle)]">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
                        Choix Technologiques
                      </span>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--akdd-text-primary)]">
                        {inspectedKdd.techChoices || '—'}
                      </p>
                    </div>
                    <div className="rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-canvas)] p-3.5 border border-[var(--akdd-border-subtle)]">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
                        Verrous & Compromis ({inspectedKdd.lockNature || 'N/A'})
                      </span>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--akdd-text-primary)]">
                        {inspectedKdd.locks || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right col: Relations & Exigences */}
                <div className="flex flex-col gap-3 rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-subtle)] p-4 border border-[var(--akdd-border-subtle)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--akdd-navy-900)]">
                      Relations & Exigences
                    </span>
                    <Link
                      to={`/explore/${encodeURIComponent(inspectedKdd.id)}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--akdd-accent-blue)] hover:underline"
                    >
                      <Compass className="h-3.5 w-3.5" /> Schéma
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-[var(--akdd-radius-sm)] bg-[var(--akdd-dir-in-bg)] p-2">
                      <div className="font-mono text-lg font-bold text-[var(--akdd-dir-in-text)]">
                        {inspectedEgo.incoming.length}
                      </div>
                      <div className="text-[10px] font-medium text-[var(--akdd-dir-in-text)]">
                        Entrantes
                      </div>
                    </div>
                    <div className="rounded-[var(--akdd-radius-sm)] bg-[var(--akdd-dir-out-bg)] p-2">
                      <div className="font-mono text-lg font-bold text-[var(--akdd-dir-out-text)]">
                        {inspectedEgo.outgoing.length}
                      </div>
                      <div className="text-[10px] font-medium text-[var(--akdd-dir-out-text)]">
                        Sortantes
                      </div>
                    </div>
                    <div className="rounded-[var(--akdd-radius-sm)] bg-[var(--akdd-bg-surface)] p-2 border border-[var(--akdd-border-subtle)]">
                      <div className="font-mono text-lg font-bold text-[var(--akdd-navy-900)]">
                        {inspectedEgo.allLinks.length}
                      </div>
                      <div className="text-[10px] font-medium text-[var(--akdd-text-muted)]">
                        Total
                      </div>
                    </div>
                  </div>

                  <div className="flex max-h-[190px] flex-col gap-1.5 overflow-y-auto pt-1">
                    {inspectedEgo.allLinks.slice(0, 8).map((item) => {
                      const peerId =
                        item.direction === 'SORTANT'
                          ? item.relation.targetId
                          : item.relation.sourceId
                      const peerName =
                        item.direction === 'SORTANT'
                          ? item.relation.targetName
                          : item.relation.sourceName
                      return (
                        <div
                          key={`${item.relation.id}-${item.direction}`}
                          className="flex items-center justify-between gap-2 rounded bg-[var(--akdd-bg-surface)] px-2.5 py-1.5 text-xs border border-[var(--akdd-border-subtle)]"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`font-mono font-bold ${
                                item.direction === 'SORTANT'
                                  ? 'text-[var(--akdd-dir-out-text)]'
                                  : 'text-[var(--akdd-dir-in-text)]'
                              }`}
                            >
                              {item.arrow}
                            </span>
                            <span className="font-mono font-semibold text-[var(--akdd-navy-800)]">
                              {peerId}
                            </span>
                            <span className="truncate text-[var(--akdd-text-secondary)]">
                              {peerName}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {inspectedEgo.allLinks.length === 0 && (
                      <p className="text-xs text-[var(--akdd-text-muted)]">
                        Aucune relation directe recensée.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* ===================== TAB 3: TRACA ===================== */}
      {activeTab === 'TRACA' && (
        <Card>
          <CardHeader
            title={`Matrice de Traçabilité Système — TRACA SYS-${meta.code}`}
            subtitle="Instanciation programme moteur : liaison Fonctions Système ↔ Requirements ↔ KDD (identifiants TRC-* générés automatiquement)"
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => void handleAddTracaRow()}
              >
                Ajouter une ligne TRC-{meta.code}
              </Button>
            }
          />
          <CardContent className="p-0">
            {subsystemTraca.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <p className="text-sm font-medium text-[var(--akdd-text-primary)]">
                  Matrice TRACA SYS-{meta.code} vierge et prête pour l’instanciation projet
                </p>
                <p className="max-w-md text-xs text-[var(--akdd-text-muted)]">
                  Conformément au référentiel générique AeroKDD, ajoutez des lignes de traçabilité
                  pour relier vos exigences programme aux KDD de {meta.code}. Les identifiants{' '}
                  <code className="font-mono">TRC-{meta.code}-001</code> sont générés
                  automatiquement.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => void handleAddTracaRow()}
                >
                  Créer TRC-{meta.code}-001
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#71717A]">
                      <th className="px-4 py-3 w-[136px]">ID TRACA</th>
                      <th className="px-4 py-3 min-w-[160px]">Élément / Fonction</th>
                      <th className="px-4 py-3 w-[140px]">ID Requirement</th>
                      <th className="px-4 py-3 min-w-[210px]">ID KDD Associé</th>
                      <th className="px-4 py-3 w-[130px]">Vérification</th>
                      <th className="px-4 py-3 w-[140px]">Preuve</th>
                      <th className="px-4 py-3 w-[120px]">Statut</th>
                      <th className="px-4 py-3 w-[120px]">Responsable</th>
                      <th className="px-4 py-3 w-[44px]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--akdd-border-subtle)]">
                    {subsystemTraca.map((row) => (
                      <tr key={row.id} className="hover:bg-[var(--akdd-bg-subtle)]">
                        <td className="px-4 py-3 font-mono font-semibold tabular-nums text-[var(--akdd-ink)] whitespace-nowrap">
                          {row.id}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.systemFunction}
                            onChange={(e) =>
                              void updateTracaEntry(row.id, { systemFunction: e.target.value })
                            }
                            placeholder="Fonction système…"
                            className="w-full rounded border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-2 py-1 text-xs focus:border-[var(--akdd-navy-600)] focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.requirementId}
                            onChange={(e) =>
                              void updateTracaEntry(row.id, { requirementId: e.target.value })
                            }
                            placeholder="REQ-001"
                            className="w-full rounded border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-2 py-1 font-mono text-xs focus:border-[var(--akdd-navy-600)] focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={row.kddId}
                            onChange={(e) => {
                              const picked = subsystemKdds.find((k) => k.id === e.target.value)
                              void updateTracaEntry(row.id, {
                                kddId: e.target.value,
                                kddName: picked?.name ?? '',
                              })
                            }}
                            className="w-full rounded border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-2 py-1 text-xs focus:border-[var(--akdd-navy-600)] focus:outline-none"
                          >
                            <option value="">— Sélectionner —</option>
                            {subsystemKdds.map((k) => (
                              <option key={k.id} value={k.id}>
                                {k.id} · {k.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={row.verificationMethod}
                            onChange={(e) =>
                              void updateTracaEntry(row.id, {
                                verificationMethod: e.target.value,
                              })
                            }
                            className="w-full rounded border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-2 py-1 text-xs focus:border-[var(--akdd-navy-600)] focus:outline-none"
                          >
                            <option value="Analyse">Analyse</option>
                            <option value="Simulation">Simulation</option>
                            <option value="Essai">Essai</option>
                            <option value="Inspection">Inspection</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.proof}
                            onChange={(e) =>
                              void updateTracaEntry(row.id, { proof: e.target.value })
                            }
                            placeholder="Réf. dossier…"
                            className="w-full rounded border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-2 py-1 text-xs focus:border-[var(--akdd-navy-600)] focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={row.status}
                            onChange={(e) =>
                              void updateTracaEntry(row.id, { status: e.target.value })
                            }
                            className="w-full rounded border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-2 py-1 text-xs focus:border-[var(--akdd-navy-600)] focus:outline-none"
                          >
                            <option value="En cours">En cours</option>
                            <option value="Validé">Validé</option>
                            <option value="À vérifier">À vérifier</option>
                            <option value="Ouvert">Ouvert</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.owner}
                            onChange={(e) =>
                              void updateTracaEntry(row.id, { owner: e.target.value })
                            }
                            placeholder="Ingénieur…"
                            className="w-full rounded border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-2 py-1 text-xs focus:border-[var(--akdd-navy-600)] focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            aria-label={`Supprimer ${row.id}`}
                            onClick={() => void deleteTracaEntry(row.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--akdd-text-muted)] hover:bg-[var(--akdd-status-contrainte-bg)] hover:text-[var(--akdd-status-contrainte-text)] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Slide-over KDD Detail Drawer */}
      <Drawer
        open={drawerKdd !== null}
        onClose={() => {
          setDrawerKdd(null)
          if (searchParams.has('kdd')) {
            searchParams.delete('kdd')
            setSearchParams(searchParams, { replace: true })
          }
        }}
        title={drawerKdd ? `${drawerKdd.id} — ${drawerKdd.name}` : ''}
        subtitle={drawerKdd ? `${drawerKdd.subsystemLabel} · ${drawerKdd.family}` : ''}
        headerExtra={
          drawerKdd && (
            <>
              <StatutBadge statut={drawerKdd.statutKdd} />
              <KsdBadge value={drawerKdd.classification} />
              <Badge className="bg-[var(--akdd-bg-surface)] text-[var(--akdd-text-secondary)] border-[var(--akdd-border-default)]">
                {drawerKdd.level}
              </Badge>
            </>
          )
        }
      >
        {drawerKdd && drawerEgo && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
                  Définition
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--akdd-text-primary)]">
                  {drawerKdd.definition || '—'}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
                  Importance & Enjeux
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--akdd-text-primary)]">
                  {drawerKdd.importance || '—'}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
                  Choix Technologiques
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--akdd-text-primary)]">
                  {drawerKdd.techChoices || '—'}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
                  Verrous ({drawerKdd.lockNature || 'N/A'})
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--akdd-text-primary)]">
                  {drawerKdd.locks || '—'}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-[var(--akdd-radius-sm)] bg-[var(--akdd-bg-canvas)] px-3 py-2 text-xs border border-[var(--akdd-border-subtle)]">
                <span className="text-[var(--akdd-text-muted)]">Référence SPEC</span>
                <span className="font-mono text-[var(--akdd-navy-800)]">
                  {drawerKdd.specRef || drawerKdd.specSheet}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--akdd-border-subtle)] pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--akdd-navy-900)]">
                  Couplages Directs ({drawerEgo.allLinks.length})
                </h3>
                <Link
                  to={`/explore/${encodeURIComponent(drawerKdd.id)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--akdd-accent-blue)] hover:underline"
                >
                  <Compass className="h-3.5 w-3.5" /> Ouvrir dans Unit Explorer
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[var(--akdd-radius-sm)] bg-[var(--akdd-dir-in-bg)] px-3 py-2 text-xs text-[var(--akdd-dir-in-text)]">
                  Entrantes (Amont) : <strong className="font-mono">{drawerEgo.incoming.length}</strong>
                </div>
                <div className="rounded-[var(--akdd-radius-sm)] bg-[var(--akdd-dir-out-bg)] px-3 py-2 text-xs text-[var(--akdd-dir-out-text)]">
                  Sortantes (Aval) : <strong className="font-mono">{drawerEgo.outgoing.length}</strong>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {drawerEgo.allLinks.slice(0, 10).map((item) => {
                  const isOut = item.direction === 'SORTANT'
                  const peerId = isOut ? item.relation.targetId : item.relation.sourceId
                  const peerName = isOut ? item.relation.targetName : item.relation.sourceName
                  return (
                    <div
                      key={`${item.relation.id}-${item.direction}`}
                      className="flex flex-col gap-0.5 rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-canvas)] px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-semibold text-[var(--akdd-navy-900)]">
                          <span
                            className={
                              isOut
                                ? 'text-[var(--akdd-dir-out-text)]'
                                : 'text-[var(--akdd-dir-in-text)]'
                            }
                          >
                            {item.arrow}
                          </span>{' '}
                          {peerId} · {peerName}
                        </span>
                        <span className="text-[11px] font-medium text-[var(--akdd-text-muted)]">
                          {item.relation.id}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--akdd-text-secondary)]">
                        {item.relation.nature} · {item.roleLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
