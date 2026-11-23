import { ArrowUpRight, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GlobalNetworkCanvas } from '../components/graphs'
import {
  KsdBadge,
  StatutBadge,
  SubsystemBadge,
} from '../components/ui'
import {
  buildGlobalGraph,
  buildKddEgoGraph,
  SUBSYSTEM_PRIORITY,
} from '../engines/graphBuilder'
import { useAeroKddStore } from '../store/useAeroKddStore'

export function NetworkPage() {
  const { kdds, relations } = useAeroKddStore()
  const [filterSubsystem, setFilterSubsystem] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const graph = useMemo(
    () => buildGlobalGraph(kdds, relations, filterSubsystem),
    [kdds, relations, filterSubsystem],
  )

  const selectedEgo = useMemo(
    () => (selectedNodeId ? buildKddEgoGraph(kdds, relations, selectedNodeId) : null),
    [kdds, relations, selectedNodeId],
  )

  const handleFilterChange = (sub: string | null) => {
    setFilterSubsystem(sub)
    setSelectedNodeId(null)
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--akdd-bg-canvas)]">
      {/* Single Clean Horizontal Subsystem Filter Bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-5 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleFilterChange(null)}
            className={`rounded-full border px-3.5 py-1 font-mono text-[11px] font-medium transition-colors shadow-none cursor-pointer ${
              filterSubsystem === null
                ? 'border-[var(--akdd-ink)] bg-[var(--akdd-ink)] text-[var(--akdd-text-inverse)]'
                : 'border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] text-[var(--akdd-text-secondary)] hover:border-[var(--akdd-ink)] hover:text-[var(--akdd-ink)]'
            }`}
          >
            ALL ({kdds.length})
          </button>
          {SUBSYSTEM_PRIORITY.map((sub) => {
            const isActive = filterSubsystem === sub
            return (
              <button
                key={sub}
                type="button"
                onClick={() => handleFilterChange(sub)}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] font-medium transition-colors shadow-none cursor-pointer ${
                  isActive
                    ? 'border-[var(--akdd-ink)] bg-[var(--akdd-ink)] text-[var(--akdd-text-inverse)]'
                    : 'border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] text-[var(--akdd-text-secondary)] hover:border-[var(--akdd-ink)] hover:text-[var(--akdd-ink)]'
                }`}
              >
                {sub}
              </button>
            )
          })}
        </div>

        <div className="hidden xl:flex items-center gap-3 font-mono text-[11px] text-[var(--akdd-text-muted)]">
          <span>
            <strong className="font-semibold text-[var(--akdd-ink)]">
              {graph.metrics.nodeCount}
            </strong>{' '}
            NŒUDS
          </span>
          <span>·</span>
          <span>
            <strong className="font-semibold text-[var(--akdd-ink)]">
              {graph.metrics.drawnRelations}
            </strong>{' '}
            LIENS ({graph.metrics.topDownRelations} TD / {graph.metrics.couplingRelations} CPL /{' '}
            {graph.metrics.contextRelations} CTX)
          </span>
        </div>
      </div>

      {/* Full-Bleed Graph Viewport + Right CAD Inspector Rail */}
      <div className="relative flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1">
          <GlobalNetworkCanvas
            graph={graph}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {selectedEgo?.selectedKdd && (
          <aside className="flex w-full shrink-0 flex-col border-t border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] xl:w-[340px] xl:border-t-0 xl:border-l">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs font-bold text-[var(--akdd-ink)]">
                  {selectedEgo.selectedKdd.id}
                </span>
                <SubsystemBadge code={selectedEgo.selectedKdd.subsystemCode} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Fermer l’inspecteur"
                className="flex h-6 w-6 items-center justify-center rounded-[var(--akdd-radius-xs)] text-[var(--akdd-text-muted)] hover:bg-[var(--akdd-slate-100)] hover:text-[var(--akdd-ink)] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatutBadge statut={selectedEgo.selectedKdd.statutKdd} />
                  <KsdBadge value={selectedEgo.selectedKdd.classification} />
                </div>
                <h3 className="font-display text-sm font-bold tracking-[-0.02em] text-[var(--akdd-ink)]">
                  {selectedEgo.selectedKdd.name}
                </h3>
                <p className="text-xs leading-relaxed text-[var(--akdd-text-muted)]">
                  {selectedEgo.selectedKdd.definition}
                </p>
              </div>

              <div className="grid grid-cols-3 divide-x divide-[var(--akdd-border-subtle)] border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] text-center">
                <div className="py-2">
                  <div className="font-mono text-sm font-bold text-[var(--akdd-dir-in-text)]">
                    {selectedEgo.incoming.length}
                  </div>
                  <div className="font-mono text-[10px] uppercase text-[var(--akdd-text-muted)]">
                    Amont
                  </div>
                </div>
                <div className="py-2">
                  <div className="font-mono text-sm font-bold text-[var(--akdd-dir-out-text)]">
                    {selectedEgo.outgoing.length}
                  </div>
                  <div className="font-mono text-[10px] uppercase text-[var(--akdd-text-muted)]">
                    Aval
                  </div>
                </div>
                <div className="py-2">
                  <div className="font-mono text-sm font-bold text-[var(--akdd-ink)]">
                    {selectedEgo.allLinks.length}
                  </div>
                  <div className="font-mono text-[10px] uppercase text-[var(--akdd-text-muted)]">
                    Total
                  </div>
                </div>
              </div>

              <Link
                to={`/explore/${encodeURIComponent(selectedEgo.selectedKdd.id)}`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--akdd-ink)] px-4 py-2 text-xs font-medium text-[var(--akdd-text-inverse)] shadow-none transition-colors hover:bg-[var(--akdd-ink-hover)]"
              >
                <span>Unit Explorer ({selectedEgo.selectedKdd.id})</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

              <div className="flex flex-col gap-1.5 border-t border-[var(--akdd-border-subtle)] pt-3">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
                  Voisins directs ({selectedEgo.allLinks.length})
                </span>
                <div className="flex flex-col divide-y divide-[var(--akdd-border-subtle)] border border-[var(--akdd-border-subtle)]">
                  {selectedEgo.allLinks.slice(0, 14).map((item) => {
                    const isOut = item.direction === 'SORTANT'
                    const peerId = isOut ? item.relation.targetId : item.relation.sourceId
                    const peerName = isOut ? item.relation.targetName : item.relation.sourceName
                    return (
                      <button
                        key={`${item.relation.id}-${item.direction}`}
                        type="button"
                        onClick={() => setSelectedNodeId(peerId)}
                        className="flex items-center justify-between gap-2 bg-[var(--akdd-bg-surface)] px-2.5 py-2 text-left text-xs transition-colors hover:bg-[var(--akdd-bg-subtle)] cursor-pointer"
                      >
                        <span className="truncate">
                          <span
                            className={`mr-1.5 font-mono font-bold ${
                              isOut
                                ? 'text-[var(--akdd-dir-out-text)]'
                                : 'text-[var(--akdd-dir-in-text)]'
                            }`}
                          >
                            {item.arrow}
                          </span>
                          <span className="font-mono font-semibold text-[var(--akdd-ink)]">
                            {peerId}
                          </span>{' '}
                          <span className="text-[var(--akdd-text-muted)]">{peerName}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
