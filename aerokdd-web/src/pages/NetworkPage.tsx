import { Compass, Network, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GlobalNetworkCanvas } from '../components/graphs'
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
    <div className="mx-auto flex max-w-[1600px] flex-col gap-7">
      {/* Live Metric Header */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Éléments Affichés"
          value={graph.metrics.nodeCount}
          subtitle={`${graph.metrics.leverNodeCount} leviers · ${graph.metrics.prestNodeCount} prestations · ${graph.metrics.otherNodeCount} autres`}
          icon={<Network className="h-5 w-5" />}
          accentClassName="border-l-[var(--akdd-navy-700)]"
        />
        <KpiCard
          label="Liens Top-Down (Vert)"
          value={graph.metrics.topDownRelations}
          subtitle="Levier ↔ Prestation"
          accentClassName="border-l-[var(--akdd-edge-topdown)]"
        />
        <KpiCard
          label="Couplages (Orange)"
          value={graph.metrics.couplingRelations}
          subtitle="Levier ↔ Levier"
          accentClassName="border-l-[var(--akdd-edge-coupling)]"
        />
        <KpiCard
          label="Contexte (Gris)"
          value={graph.metrics.contextRelations}
          subtitle={`Total tracé : ${graph.metrics.drawnRelations} relations`}
          accentClassName="border-l-[var(--akdd-edge-context)]"
        />
      </section>

      {/* Filter Bar + Permanent Legend */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleFilterChange(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                filterSubsystem === null
                  ? 'bg-[var(--akdd-navy-700)] text-[var(--akdd-text-inverse)] border-[var(--akdd-navy-700)]'
                  : 'bg-[var(--akdd-bg-canvas)] text-[var(--akdd-navy-800)] border-[var(--akdd-border-default)] hover:border-[var(--akdd-navy-600)]'
              }`}
            >
              All 10 Subsystems ({kdds.length})
            </button>
            {SUBSYSTEM_PRIORITY.map((sub) => {
              const isActive = filterSubsystem === sub
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleFilterChange(sub)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--akdd-navy-800)] text-[var(--akdd-text-inverse)] border-[var(--akdd-navy-800)]'
                      : 'bg-[var(--akdd-bg-canvas)] text-[var(--akdd-text-secondary)] border-[var(--akdd-border-subtle)] hover:border-[var(--akdd-navy-600)]'
                  }`}
                >
                  {sub}
                </button>
              )
            })}
          </div>

          {/* Permanent Color Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--akdd-border-subtle)] pt-2.5 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-[var(--akdd-text-muted)] mr-1">Nœuds :</span>
              <Badge className="bg-[var(--akdd-status-kdd-bg)] text-[var(--akdd-status-kdd-text)] border-[var(--akdd-status-kdd-border)]">
                KDD
              </Badge>
              <Badge className="bg-[var(--akdd-status-s-bg)] text-[var(--akdd-status-s-text)] border-[var(--akdd-status-s-border)]">
                S - Sizing
              </Badge>
              <Badge className="bg-[var(--akdd-status-d-bg)] text-[var(--akdd-status-d-text)] border-[var(--akdd-status-d-border)]">
                D - Design
              </Badge>
              <Badge className="bg-[var(--akdd-status-prestation-bg)] text-[var(--akdd-status-prestation-text)] border-[var(--akdd-status-prestation-border)]">
                Prestation
              </Badge>
              <Badge className="bg-[var(--akdd-status-input-bg)] text-[var(--akdd-status-input-text)] border-[var(--akdd-status-input-border)]">
                Input
              </Badge>
              <Badge className="bg-[var(--akdd-status-contrainte-bg)] text-[var(--akdd-status-contrainte-text)] border-[var(--akdd-status-contrainte-border)]">
                Contrainte
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[var(--akdd-text-secondary)]">
              <span className="font-semibold text-[var(--akdd-text-muted)]">Liens :</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-[var(--akdd-edge-topdown)]" /> Top-Down
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-[var(--akdd-edge-coupling)]" /> Couplage
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-[var(--akdd-edge-context)]" /> Contexte
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-t-2 border-dashed border-[var(--akdd-val-rejected)]" />{' '}
                Rejeté
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Canvas + Click-to-Inspect Side Panel */}
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex-1 min-w-0">
          <GlobalNetworkCanvas
            graph={graph}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {/* Click-to-Inspect Side Panel */}
        <Card className="w-full xl:w-[340px] shrink-0">
          <CardHeader
            title="Inspecteur de Nœud"
            subtitle={
              selectedEgo?.selectedKdd
                ? selectedEgo.selectedKdd.id
                : 'Cliquez un nœud du graphe'
            }
            action={
              selectedNodeId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNodeId(null)}
                  aria-label="Désélectionner"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              ) : undefined
            }
          />
          <CardContent className="flex flex-col gap-4">
            {!selectedEgo?.selectedKdd ? (
              <p className="py-8 text-center text-xs text-[var(--akdd-text-muted)]">
                Sélectionnez un nœud dans la cartographie circulaire pour mettre en surbrillance son
                voisinage direct et consulter sa fiche.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SubsystemBadge code={selectedEgo.selectedKdd.subsystemCode} />
                    <StatutBadge statut={selectedEgo.selectedKdd.statutKdd} />
                    <KsdBadge value={selectedEgo.selectedKdd.classification} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--akdd-text-primary)]">
                    {selectedEgo.selectedKdd.id} — {selectedEgo.selectedKdd.name}
                  </h3>
                  <p className="text-xs leading-relaxed text-[var(--akdd-text-secondary)]">
                    {selectedEgo.selectedKdd.definition}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-[var(--akdd-radius-sm)] bg-[var(--akdd-dir-in-bg)] p-2">
                    <div className="font-mono text-base font-bold text-[var(--akdd-dir-in-text)]">
                      {selectedEgo.incoming.length}
                    </div>
                    <div className="text-[10px] text-[var(--akdd-dir-in-text)]">Entrantes</div>
                  </div>
                  <div className="rounded-[var(--akdd-radius-sm)] bg-[var(--akdd-dir-out-bg)] p-2">
                    <div className="font-mono text-base font-bold text-[var(--akdd-dir-out-text)]">
                      {selectedEgo.outgoing.length}
                    </div>
                    <div className="text-[10px] text-[var(--akdd-dir-out-text)]">Sortantes</div>
                  </div>
                  <div className="rounded-[var(--akdd-radius-sm)] bg-[var(--akdd-bg-canvas)] p-2 border border-[var(--akdd-border-subtle)]">
                    <div className="font-mono text-base font-bold text-[var(--akdd-navy-900)]">
                      {selectedEgo.allLinks.length}
                    </div>
                    <div className="text-[10px] text-[var(--akdd-text-muted)]">Total</div>
                  </div>
                </div>

                <Link
                  to={`/explore/${encodeURIComponent(selectedEgo.selectedKdd.id)}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--akdd-ink)] px-4 py-2 text-xs font-medium text-[var(--akdd-text-inverse)] shadow-none hover:bg-[var(--akdd-ink-hover)] transition-colors"
                >
                  <Compass className="h-4 w-4" />
                  Ouvrir dans Unit Explorer (/explore/{selectedEgo.selectedKdd.id})
                </Link>

                <div className="flex max-h-[240px] flex-col gap-1.5 overflow-y-auto border-t border-[var(--akdd-border-subtle)] pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
                    Voisins directs ({selectedEgo.allLinks.length})
                  </span>
                  {selectedEgo.allLinks.slice(0, 12).map((item) => {
                    const isOut = item.direction === 'SORTANT'
                    const peerId = isOut ? item.relation.targetId : item.relation.sourceId
                    const peerName = isOut ? item.relation.targetName : item.relation.sourceName
                    return (
                      <button
                        key={`${item.relation.id}-${item.direction}`}
                        type="button"
                        onClick={() => setSelectedNodeId(peerId)}
                        className="flex items-center justify-between gap-2 rounded bg-[var(--akdd-bg-canvas)] px-2.5 py-1.5 text-left text-xs border border-[var(--akdd-border-subtle)] hover:border-[var(--akdd-navy-600)] cursor-pointer"
                      >
                        <span className="truncate">
                          <span
                            className={`font-mono font-bold mr-1 ${
                              isOut
                                ? 'text-[var(--akdd-dir-out-text)]'
                                : 'text-[var(--akdd-dir-in-text)]'
                            }`}
                          >
                            {item.arrow}
                          </span>
                          <span className="font-mono font-semibold text-[var(--akdd-navy-800)]">
                            {peerId}
                          </span>{' '}
                          <span className="text-[var(--akdd-text-secondary)]">{peerName}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
