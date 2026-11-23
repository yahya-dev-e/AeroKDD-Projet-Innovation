import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  Search,
  Share2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EgoSchemaFlow } from '../components/graphs'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  KpiCard,
  KsdBadge,
  StatutBadge,
  SubsystemBadge,
} from '../components/ui'
import { buildKddEgoGraph } from '../engines/graphBuilder'
import { useAeroKddStore } from '../store/useAeroKddStore'
import type { SourceRef } from '../types/aerokdd'

type DirectionFilter = 'ALL' | 'ENTRANT' | 'SORTANT'

export function ExplorerPage() {
  const { kddId: routeKddId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { kdds, relations, sources } = useAeroKddStore()

  const queryKddId = searchParams.get('kdd')
  const [selectedId, setSelectedId] = useState<string>(
    routeKddId || queryKddId || 'BOOSTER-021',
  )
  const [selectorQuery, setSelectorQuery] = useState('')
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL')
  const [tableSearch, setTableSearch] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const incoming = routeKddId || queryKddId
    if (incoming) {
      setSelectedId(incoming.toUpperCase())
    } else if (kdds.length > 0 && !kdds.some((k) => k.id === selectedId)) {
      const fallback = kdds.find((k) => k.id === 'BOOSTER-021') ?? kdds[0]
      setSelectedId(fallback.id)
    }
  }, [routeKddId, queryKddId, kdds, selectedId])

  useEffect(() => {
    if (!isFullscreen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isFullscreen])

  const sourceById = useMemo(() => {
    const map = new Map<string, SourceRef>()
    for (const s of sources) map.set(s.id.toUpperCase(), s)
    return map
  }, [sources])

  const ego = useMemo(
    () => buildKddEgoGraph(kdds, relations, selectedId),
    [kdds, relations, selectedId],
  )

  const selectorMatches = useMemo(() => {
    const q = selectorQuery.trim().toLowerCase()
    if (!q) return kdds.slice(0, 15)
    return kdds
      .filter(
        (k) =>
          k.id.toLowerCase().includes(q) ||
          k.name.toLowerCase().includes(q) ||
          k.subsystemCode.toLowerCase().includes(q),
      )
      .slice(0, 20)
  }, [kdds, selectorQuery])

  const filteredLinks = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    return ego.allLinks.filter((item) => {
      if (directionFilter !== 'ALL' && item.direction !== directionFilter) return false
      if (!q) return true
      const r = item.relation
      return (
        r.id.toLowerCase().includes(q) ||
        r.sourceId.toLowerCase().includes(q) ||
        r.sourceName.toLowerCase().includes(q) ||
        r.targetId.toLowerCase().includes(q) ||
        r.targetName.toLowerCase().includes(q) ||
        r.nature.toLowerCase().includes(q) ||
        r.justification.toLowerCase().includes(q) ||
        item.roleLabel.toLowerCase().includes(q)
      )
    })
  }, [ego.allLinks, directionFilter, tableSearch])

  const handleSelectKdd = (id: string) => {
    setSelectedId(id)
    setSelectorOpen(false)
    setSelectorQuery('')
    navigate(`/explore/${encodeURIComponent(id)}`)
  }

  const resolveSourceRefs = (refField: string): SourceRef[] => {
    if (!refField) return []
    const matches = refField.toUpperCase().match(/REF-\d+/g) ?? []
    const unique = Array.from(new Set(matches))
    return unique.map((id) => sourceById.get(id)).filter((s): s is SourceRef => Boolean(s))
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      {/* Searchable KDD Selector Header */}
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-[var(--akdd-text-primary)]">
                  Unit Explorer — GRAPH_KDD & SCHEMA KDD
                </h1>
                {ego.selectedKdd && (
                  <>
                    <SubsystemBadge code={ego.selectedKdd.subsystemCode} />
                    <StatutBadge statut={ego.selectedKdd.statutKdd} />
                    <KsdBadge value={ego.selectedKdd.classification} />
                  </>
                )}
              </div>
              {ego.selectedKdd && (
                <p className="text-xs text-[var(--akdd-text-secondary)]">
                  <strong className="font-mono text-[var(--akdd-navy-900)]">
                    {ego.selectedKdd.id}
                  </strong>{' '}
                  — {ego.selectedKdd.name} · {ego.selectedKdd.definition}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {['BOOSTER-021', 'FAN-035', 'FAN-020', 'COMB-022'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectKdd(preset)}
                  className={`rounded-[var(--akdd-radius-xs)] px-2 py-1 text-xs font-mono border cursor-pointer transition-colors ${
                    selectedId === preset
                      ? 'bg-[var(--akdd-navy-700)] text-[var(--akdd-text-inverse)] border-[var(--akdd-navy-700)]'
                      : 'bg-[var(--akdd-bg-canvas)] text-[var(--akdd-text-secondary)] border-[var(--akdd-border-subtle)] hover:border-[var(--akdd-navy-600)]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Searchable Selector Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-[var(--akdd-radius-md)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-[var(--akdd-text-muted)]" />
              <input
                type="text"
                value={selectorQuery}
                onFocus={() => setSelectorOpen(true)}
                onChange={(e) => {
                  setSelectorQuery(e.target.value)
                  setSelectorOpen(true)
                }}
                placeholder="Rechercher un KDD à explorer (ex. BOOSTER-021, FAN-035, Pressure Ratio)…"
                className="flex-1 bg-transparent text-sm text-[var(--akdd-text-primary)] placeholder:text-[var(--akdd-text-muted)] focus:outline-none"
              />
              {selectorOpen && (
                <Button variant="ghost" size="sm" onClick={() => setSelectorOpen(false)}>
                  Fermer
                </Button>
              )}
            </div>

            {selectorOpen && (
              <div className="flex max-h-56 flex-col overflow-y-auto rounded-[var(--akdd-radius-md)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-surface)] divide-y divide-[var(--akdd-border-subtle)] shadow-[var(--akdd-shadow-md)]">
                {selectorMatches.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => handleSelectKdd(k.id)}
                    className="flex items-center justify-between gap-3 px-3.5 py-2 text-left text-xs hover:bg-[var(--akdd-accent-blue-soft)] cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-[var(--akdd-navy-900)]">
                        {k.id}
                      </span>
                      <span className="font-medium text-[var(--akdd-text-primary)] truncate">
                        {k.name}
                      </span>
                    </div>
                    <StatutBadge statut={k.statutKdd} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top KPI Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Relations Entrantes (Amont)"
          value={ego.incoming.length}
          subtitle="Paramètres qui influencent ce KDD"
          icon={<ArrowDownLeft className="h-5 w-5 text-[var(--akdd-dir-in-border)]" />}
          accentClassName="border-l-[var(--akdd-dir-in-border)]"
        />
        <KpiCard
          label="Relations Sortantes (Aval)"
          value={ego.outgoing.length}
          subtitle="Paramètres impactés par ce KDD"
          icon={<ArrowUpRight className="h-5 w-5 text-[var(--akdd-dir-out-border)]" />}
          accentClassName="border-l-[var(--akdd-dir-out-border)]"
        />
        <KpiCard
          label="Total des Couplages Directs"
          value={ego.allLinks.length}
          subtitle="Cliquez sur un nœud du schéma pour naviguer"
          icon={<Share2 className="h-5 w-5" />}
          accentClassName="border-l-[var(--akdd-navy-800)]"
        />
      </section>

      {/* 3-Column Interactive React Flow Diagram */}
      <Card className="overflow-hidden">
        <CardHeader
          title="SCHEMA KDD — Vue Orientée 3 Colonnes (Amont | KDD Sélectionné | Aval)"
          subtitle="Bleu = Entrants · Bleu marine = KDD exploré · Rouge = Sortants"
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Maximize2 className="h-3.5 w-3.5" />}
              onClick={() => setIsFullscreen(true)}
            >
              Plein écran
            </Button>
          }
        />
        <div className="h-[460px] w-full bg-[#fbfdff]">
          <EgoSchemaFlow ego={ego} onSelectKdd={handleSelectKdd} />
        </div>
      </Card>

      {/* Synchronized Filterable Relations Table */}
      <Card>
        <CardHeader
          title={`Table Détaillée des Relations — ${ego.selectedKdd?.id ?? selectedId}`}
          subtitle="Justifications physiques, équations et références bibliographiques NASA"
          action={
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'ENTRANT', 'SORTANT'] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setDirectionFilter(dir)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border cursor-pointer transition-colors ${
                    directionFilter === dir
                      ? 'bg-[var(--akdd-navy-700)] text-[var(--akdd-text-inverse)] border-[var(--akdd-navy-700)]'
                      : 'bg-[var(--akdd-bg-canvas)] text-[var(--akdd-text-secondary)] border-[var(--akdd-border-subtle)]'
                  }`}
                >
                  {dir === 'ALL'
                    ? `Toutes (${ego.allLinks.length})`
                    : dir === 'ENTRANT'
                      ? `Entrantes (${ego.incoming.length})`
                      : `Sortantes (${ego.outgoing.length})`}
                </button>
              ))}
            </div>
          }
        />
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-3 py-1.5 max-w-md">
            <Search className="h-3.5 w-3.5 text-[var(--akdd-text-muted)]" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filtrer le tableau (ID, nature, justification)…"
              className="flex-1 bg-transparent text-xs text-[var(--akdd-text-primary)] placeholder:text-[var(--akdd-text-muted)] focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto rounded-[var(--akdd-radius-md)] border border-[var(--akdd-border-subtle)]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-canvas)] text-[11px] font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
                  <th className="px-3 py-2.5 w-[105px]">Sens</th>
                  <th className="px-3 py-2.5 w-[90px]">ID Rel.</th>
                  <th className="px-3 py-2.5 min-w-[200px]">Paramètre lié</th>
                  <th className="px-3 py-2.5 min-w-[160px]">Nature & Rôle</th>
                  <th className="px-3 py-2.5 min-w-[260px]">Justification Physique</th>
                  <th className="px-3 py-2.5 w-[150px]">Sources NASA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--akdd-border-subtle)]">
                {filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--akdd-text-muted)]">
                      Aucune relation ne correspond à ce filtre.
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map((item) => {
                    const isOut = item.direction === 'SORTANT'
                    const peerId = isOut ? item.relation.targetId : item.relation.sourceId
                    const peerName = isOut ? item.relation.targetName : item.relation.sourceName
                    const refs = resolveSourceRefs(item.relation.sourceRef)

                    return (
                      <tr
                        key={`${item.relation.id}-${item.direction}`}
                        className="hover:bg-[var(--akdd-slate-50)]"
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <Badge
                            className={
                              isOut
                                ? 'bg-[var(--akdd-dir-out-bg)] text-[var(--akdd-dir-out-text)] border-[var(--akdd-dir-out-border)] font-semibold'
                                : 'bg-[var(--akdd-dir-in-bg)] text-[var(--akdd-dir-in-text)] border-[var(--akdd-dir-in-border)] font-semibold'
                            }
                          >
                            {item.arrow} {item.direction}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[var(--akdd-text-muted)] whitespace-nowrap">
                          {item.relation.id}
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleSelectKdd(peerId)}
                            className="flex flex-col text-left hover:underline cursor-pointer"
                          >
                            <span className="font-mono font-bold text-[var(--akdd-navy-800)]">
                              {peerId}
                            </span>
                            <span className="text-[var(--akdd-text-primary)]">{peerName}</span>
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-[var(--akdd-text-primary)]">
                              {item.relation.nature}
                            </span>
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: item.roleColorHex }}
                            >
                              {item.roleLabel}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1">
                            <span className="leading-relaxed text-[var(--akdd-text-secondary)]">
                              {item.relation.justification || '—'}
                            </span>
                            {item.relation.equation && (
                              <code className="w-fit rounded bg-[var(--akdd-slate-100)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--akdd-navy-900)]">
                                {item.relation.equation}
                              </code>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {refs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {refs.map((ref) =>
                                ref.url ? (
                                  <a
                                    key={ref.id}
                                    href={ref.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={`${ref.organization} — ${ref.title}`}
                                    className="inline-flex items-center gap-1 rounded bg-[var(--akdd-accent-blue-soft)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--akdd-navy-800)] hover:underline"
                                  >
                                    {ref.id}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <span
                                    key={ref.id}
                                    className="rounded bg-[var(--akdd-slate-100)] px-1.5 py-0.5 font-mono text-[11px]"
                                  >
                                    {ref.id}
                                  </span>
                                ),
                              )}
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-[var(--akdd-text-muted)]">
                              {item.relation.sourceRef || '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Overlay for SCHEMA KDD */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[var(--akdd-bg-surface)]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between gap-4 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-navy-900)] px-5 py-3 text-[var(--akdd-text-inverse)]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-sm font-bold">{ego.selectedKdd?.id}</span>
              <span className="text-sm truncate">{ego.selectedKdd?.name}</span>
              <span className="text-xs text-[var(--akdd-slate-300)] font-mono">
                Entrantes: {ego.incoming.length} · Sortantes: {ego.outgoing.length}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Minimize2 className="h-3.5 w-3.5" />}
              onClick={() => setIsFullscreen(false)}
            >
              Quitter plein écran (Esc)
            </Button>
          </div>
          <div className="flex-1 bg-[#fbfdff]">
            <EgoSchemaFlow ego={ego} onSelectKdd={handleSelectKdd} />
          </div>
        </div>
      )}
    </div>
  )
}
