import {
  ArrowRight,
  BookOpen,
  Compass,
  Database,
  GitBranch,
  Layers,
  Link2,
  Network,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, CardContent, CardHeader, KpiCard, SubsystemBadge } from '../components/ui'
import { normalizeSubsystemCode, statutToShortCat } from '../engines/graphBuilder'
import { useAeroKddStore } from '../store/useAeroKddStore'
import { SUBSYSTEM_CATALOG } from '../types/subsystems'

export function OverviewPage() {
  const { kdds, relations, bibliotheque, sources } = useAeroKddStore()

  const summary = useMemo(() => {
    let kCount = 0
    let sCount = 0
    let dCount = 0
    let prestCount = 0
    let otherCount = 0

    const bySub: Record<
      string,
      { total: number; k: number; s: number; d: number; links: number }
    > = {}

    for (const sub of SUBSYSTEM_CATALOG) {
      bySub[sub.code] = { total: 0, k: 0, s: 0, d: 0, links: 0 }
    }

    for (const kdd of kdds) {
      const cat = statutToShortCat(kdd)
      if (cat === 'KDD') kCount += 1
      else if (cat === 'S') sCount += 1
      else if (cat === 'D') dCount += 1
      else if (cat === 'PRESTATION') prestCount += 1
      else otherCount += 1

      const code = normalizeSubsystemCode(kdd.subsystemCode, kdd.subsystemLabel)
      const bucket = bySub[code]
      if (bucket) {
        bucket.total += 1
        if (cat === 'KDD') bucket.k += 1
        else if (cat === 'S') bucket.s += 1
        else if (cat === 'D') bucket.d += 1
      }
    }

    for (const rel of relations) {
      const src = normalizeSubsystemCode(rel.sourceId.split('-')[0] ?? rel.sourceSubsystem)
      const tgt = normalizeSubsystemCode(rel.targetId.split('-')[0] ?? rel.targetSubsystem)
      if (bySub[src]) bySub[src].links += 1
      if (tgt !== src && bySub[tgt]) bySub[tgt].links += 1
    }

    return { kCount, sCount, dCount, prestCount, otherCount, bySub }
  }, [kdds, relations])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Executive Header Banner */}
      <section className="flex flex-col gap-3 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-navy-900)] px-6 py-6 text-[var(--akdd-text-inverse)] shadow-[var(--akdd-shadow-md)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-[var(--akdd-radius-xs)] bg-[var(--akdd-navy-700)] px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase border border-[var(--akdd-navy-600)]">
                Projet Innovation · ECC × SHERPA Engineering
              </span>
              <span className="text-xs text-[var(--akdd-slate-300)] font-mono">
                Référentiel Turboréacteur
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              AeroKDD — Référentiel de Spécifications Génériques & Key Design Drivers
            </h1>
            <p className="max-w-3xl text-sm text-[var(--akdd-slate-300)]">
              Structuration, traçabilité système, analyse Top-Down à deux niveaux et cartographie
              des couplages physiques sur les 10 sous-systèmes propulsifs.
            </p>
          </div>
        </div>
      </section>

      {/* Executive KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Éléments du Référentiel"
          value={kdds.length}
          subtitle={`${summary.kCount + summary.sCount + summary.dCount} leviers · ${summary.prestCount} prestations · ${summary.otherCount} inputs/contraintes`}
          icon={<Database className="h-5 w-5" />}
          accentClassName="border-l-[var(--akdd-navy-700)]"
          footer={
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className="bg-[var(--akdd-status-kdd-bg)] text-[var(--akdd-status-kdd-text)] border-[var(--akdd-status-kdd-border)]">
                {summary.kCount} KDD
              </Badge>
              <Badge className="bg-[var(--akdd-status-s-bg)] text-[var(--akdd-status-s-text)] border-[var(--akdd-status-s-border)]">
                {summary.sCount} S
              </Badge>
              <Badge className="bg-[var(--akdd-status-d-bg)] text-[var(--akdd-status-d-text)] border-[var(--akdd-status-d-border)]">
                {summary.dCount} D
              </Badge>
            </div>
          }
        />

        <KpiCard
          label="Couplages Actifs"
          value={relations.length.toLocaleString('fr-FR')}
          subtitle="Matrice active KDD - Relations (E1–E3)"
          icon={<Link2 className="h-5 w-5" />}
          accentClassName="border-l-[var(--akdd-edge-topdown)]"
        />

        <KpiCard
          label="Sous-Systèmes Propulsifs"
          value={SUBSYSTEM_CATALOG.length}
          subtitle="Triptyque SPEC-* / TDB-* / TRACA SYS-*"
          icon={<Layers className="h-5 w-5" />}
          accentClassName="border-l-[var(--akdd-accent-blue)]"
        />

        <KpiCard
          label="Bibliothèque & Sources"
          value={bibliotheque.length.toLocaleString('fr-FR')}
          subtitle={`${sources.length} références ouvertes (NASA Glenn, NTRS, NACA)`}
          icon={<BookOpen className="h-5 w-5" />}
          accentClassName="border-l-[var(--akdd-edge-coupling)]"
        />
      </section>

      {/* Quick-Launch Analysis Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          to="/top-down"
          className="group flex flex-col justify-between gap-4 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] p-5 shadow-[var(--akdd-shadow-sm)] hover:border-[var(--akdd-edge-topdown)] hover:shadow-[var(--akdd-shadow-md)] transition-all"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--akdd-radius-md)] bg-[var(--akdd-edge-topdown-bg)] text-[var(--akdd-edge-topdown-text)]">
                <GitBranch className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono text-[var(--akdd-text-muted)]">10 thématiques</span>
            </div>
            <h2 className="text-base font-semibold text-[var(--akdd-text-primary)]">
              Moteur d’Analyse Top-Down
            </h2>
            <p className="text-xs leading-relaxed text-[var(--akdd-text-secondary)]">
              Partez d’une prestation cible (ex. Bruit / Acoustique) pour remonter vers les leviers
              directs (Niv. 1), indirects (Niv. 2), badges Carrefour et effets de bord réels.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--akdd-edge-topdown-text)] group-hover:translate-x-0.5 transition-transform">
            Lancer l’analyse Top-Down <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          to="/network"
          className="group flex flex-col justify-between gap-4 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] p-5 shadow-[var(--akdd-shadow-sm)] hover:border-[var(--akdd-navy-600)] hover:shadow-[var(--akdd-shadow-md)] transition-all"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--akdd-radius-md)] bg-[var(--akdd-accent-blue-soft)] text-[var(--akdd-navy-700)]">
                <Network className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono text-[var(--akdd-text-muted)]">566 nœuds</span>
            </div>
            <h2 className="text-base font-semibold text-[var(--akdd-text-primary)]">
              Cartographie Globale du Réseau
            </h2>
            <p className="text-xs leading-relaxed text-[var(--akdd-text-secondary)]">
              Explorez la topologie circulaire des 10 sous-systèmes, les liens Top-Down (vert),
              couplages Levier–Levier (orange) et vues filtrées par module.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--akdd-navy-700)] group-hover:translate-x-0.5 transition-transform">
            Ouvrir le Graphe Global <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          to="/explore"
          className="group flex flex-col justify-between gap-4 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] p-5 shadow-[var(--akdd-shadow-sm)] hover:border-[var(--akdd-edge-coupling)] hover:shadow-[var(--akdd-shadow-md)] transition-all"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--akdd-radius-md)] bg-[var(--akdd-edge-coupling-bg)] text-[var(--akdd-edge-coupling-text)]">
                <Compass className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono text-[var(--akdd-text-muted)]">Amont / Aval</span>
            </div>
            <h2 className="text-base font-semibold text-[var(--akdd-text-primary)]">
              Unit Explorer (GRAPH_KDD)
            </h2>
            <p className="text-xs leading-relaxed text-[var(--akdd-text-secondary)]">
              Inspectez un paramètre unique avec ses relations entrantes (bleu) et sortantes (rouge)
              et son schéma orienté plein écran.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--akdd-edge-coupling-text)] group-hover:translate-x-0.5 transition-transform">
            Explorer un KDD <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </section>

      {/* Interactive 10-Subsystem Selector Grid */}
      <Card>
        <CardHeader
          title="Architecture Propulsive — 10 Sous-Systèmes"
          subtitle="Sélectionnez un module pour ouvrir son espace triptyque SPEC / TDB / TRACA"
        />
        <CardContent>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {SUBSYSTEM_CATALOG.map((sub) => {
              const stats = summary.bySub[sub.code]
              return (
                <Link
                  key={sub.code}
                  to={`/subsystems/${sub.code}`}
                  className="group flex flex-col justify-between gap-3 rounded-[var(--akdd-radius-md)] border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-canvas)] p-4 hover:border-[var(--akdd-navy-600)] hover:bg-[var(--akdd-bg-surface)] hover:shadow-[var(--akdd-shadow-sm)] transition-all"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <SubsystemBadge code={sub.code} />
                      <span className="font-mono text-xs font-semibold text-[var(--akdd-text-secondary)]">
                        {stats?.total ?? 0} KDD
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--akdd-text-primary)]">
                      {sub.frenchName}
                    </h3>
                    <p className="text-xs leading-snug text-[var(--akdd-text-muted)]">
                      {sub.shortRole}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[var(--akdd-border-subtle)] pt-2.5 text-[11px]">
                    <div className="flex items-center gap-1 font-mono">
                      <span className="rounded bg-[var(--akdd-status-kdd-bg)] px-1.5 py-0.5 text-[var(--akdd-status-kdd-text)] font-semibold">
                        K:{stats?.k ?? 0}
                      </span>
                      <span className="rounded bg-[var(--akdd-status-s-bg)] px-1.5 py-0.5 text-[var(--akdd-status-s-text)] font-semibold">
                        S:{stats?.s ?? 0}
                      </span>
                      <span className="rounded bg-[var(--akdd-status-d-bg)] px-1.5 py-0.5 text-[var(--akdd-status-d-text)]">
                        D:{stats?.d ?? 0}
                      </span>
                    </div>
                    <span className="font-mono text-[var(--akdd-text-muted)]">
                      {stats?.links ?? 0} liens
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
