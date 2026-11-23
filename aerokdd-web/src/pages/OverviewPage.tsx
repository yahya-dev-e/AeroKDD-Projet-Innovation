import {
  ArrowUpRight,
  Compass,
  GitBranch,
  Network,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, CardContent, CardHeader, SubsystemBadge } from '../components/ui'
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

  const total = Math.max(kdds.length, 1)
  const composition = [
    { label: 'KDD', value: summary.kCount, bar: 'bg-[var(--akdd-status-kdd-border)]' },
    { label: 'S', value: summary.sCount, bar: 'bg-[var(--akdd-status-s-border)]' },
    { label: 'D', value: summary.dCount, bar: 'bg-[var(--akdd-status-d-border)]' },
    { label: 'Prestation', value: summary.prestCount, bar: 'bg-[var(--akdd-status-prestation-border)]' },
    { label: 'Autres', value: summary.otherCount, bar: 'bg-[var(--akdd-status-input-border)]' },
  ]

  const engines = [
    {
      index: '01',
      to: '/top-down',
      icon: GitBranch,
      title: 'Moteur d’Analyse Top-Down',
      meta: '10 THÉMATIQUES',
      text: 'Remontée causale depuis une prestation système vers les leviers directs (N1), relais inter-modules (N2) et effets induits.',
    },
    {
      index: '02',
      to: '/network',
      icon: Network,
      title: 'Cartographie Globale du Réseau',
      meta: `${kdds.length.toLocaleString('en-US')} NŒUDS`,
      text: 'Topologie complète des 10 sous-systèmes propulsifs avec codage sémantique des liens Top-Down, couplages et contexte.',
    },
    {
      index: '03',
      to: '/explore',
      icon: Compass,
      title: 'Unit Explorer (GRAPH_KDD)',
      meta: 'AMONT · AVAL',
      text: 'Inspection unitaire d’un paramètre avec ses relations entrantes, sortantes, équations physiques et schéma orienté.',
    },
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Swiss Editorial Masthead & Live Telemetry Matrix */}
      <section className="overflow-hidden rounded-[var(--akdd-radius-lg)] border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] px-6 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
          <span>00 / Référentiel Turboréacteur Double Flux · ECC × SHERPA Engineering</span>
          <span className="text-[var(--akdd-text-primary)]">
            SPEC · TDB · TRACA · TOP-DOWN
          </span>
        </div>

        <div className="grid grid-cols-1 divide-y divide-[var(--akdd-border-subtle)] lg:grid-cols-[1.35fr_1fr] lg:divide-x lg:divide-y-0">
          {/* Editorial Statement */}
          <div className="flex flex-col justify-between gap-8 p-8 lg:p-10">
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-[-0.035em] text-[var(--akdd-text-primary)] sm:text-[42px]">
                Architecture Propulsive &amp; Key Design Drivers.
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[var(--akdd-text-muted)]">
                Référentiel formel d’ingénierie système reliant les exigences de performance aux
                paramètres physiques de dimensionnement (KDD, S, D), aux équations de couplage et à
                la traçabilité sur 10 sous-systèmes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/top-down"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--akdd-ink)] bg-[var(--akdd-ink)] px-5 py-2.5 text-xs font-medium text-[var(--akdd-text-inverse)] shadow-none transition-colors hover:bg-[var(--akdd-ink-hover)]"
              >
                Lancer l’analyse Top-Down <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/network"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-4 py-2.5 text-xs font-medium text-[var(--akdd-text-primary)] shadow-none transition-colors hover:border-[var(--akdd-ink)] hover:bg-[var(--akdd-bg-subtle)]"
              >
                Graphe global
              </Link>
              <Link
                to="/manager"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-4 py-2.5 text-xs font-medium text-[var(--akdd-text-primary)] shadow-none transition-colors hover:border-[var(--akdd-ink)] hover:bg-[var(--akdd-bg-subtle)]"
              >
                KDD Manager
              </Link>
            </div>
          </div>

          {/* Architectural 2x2 KPI Telemetry + Taxonomic Bar */}
          <div className="flex flex-col divide-y divide-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)]">
            <div className="grid grid-cols-2 divide-x divide-[var(--akdd-border-subtle)]">
              <div className="flex flex-col gap-1.5 p-5 lg:p-6">
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
                  01 / Éléments KDD
                </span>
                <span className="font-display text-3xl font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--akdd-text-primary)] sm:text-4xl">
                  {kdds.length.toLocaleString('en-US')}
                </span>
                <span className="font-mono text-[10.5px] text-[var(--akdd-text-muted)]">
                  {summary.kCount + summary.sCount + summary.dCount} leviers physiques
                </span>
              </div>

              <div className="flex flex-col gap-1.5 p-5 lg:p-6">
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
                  02 / Couplages Actifs
                </span>
                <span className="font-display text-3xl font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--akdd-text-primary)] sm:text-4xl">
                  {relations.length.toLocaleString('en-US')}
                </span>
                <span className="font-mono text-[10.5px] text-[var(--akdd-text-muted)]">
                  Matrice KDD E1–E3
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-[var(--akdd-border-subtle)]">
              <div className="flex flex-col gap-1.5 p-5 lg:p-6">
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
                  03 / Sous-Systèmes
                </span>
                <span className="font-display text-3xl font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--akdd-text-primary)] sm:text-4xl">
                  {SUBSYSTEM_CATALOG.length}
                </span>
                <span className="font-mono text-[10.5px] text-[var(--akdd-text-muted)]">
                  Modules propulsifs
                </span>
              </div>

              <div className="flex flex-col gap-1.5 p-5 lg:p-6">
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
                  04 / Bibliothèque
                </span>
                <span className="font-display text-3xl font-bold leading-none tracking-[-0.03em] tabular-nums text-[var(--akdd-text-primary)] sm:text-4xl">
                  {bibliotheque.length.toLocaleString('en-US')}
                </span>
                <span className="font-mono text-[10.5px] text-[var(--akdd-text-muted)]">
                  {sources.length} sources ouvertes
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 bg-[var(--akdd-bg-surface)] p-5 lg:px-6">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
                <span>Distribution taxonomique (Statuts KDD)</span>
                <span>100%</span>
              </div>
              <div className="flex h-1.5 w-full overflow-hidden rounded-[2px] border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)]">
                {composition.map((c) => (
                  <span
                    key={c.label}
                    className={c.bar}
                    style={{ width: `${(c.value / total) * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <Badge className="bg-[var(--akdd-status-kdd-bg)] text-[var(--akdd-status-kdd-text)] border-[var(--akdd-status-kdd-border)]">
                  {summary.kCount} KDD
                </Badge>
                <Badge className="bg-[var(--akdd-status-s-bg)] text-[var(--akdd-status-s-text)] border-[var(--akdd-status-s-border)]">
                  {summary.sCount} S
                </Badge>
                <Badge className="bg-[var(--akdd-status-d-bg)] text-[var(--akdd-status-d-text)] border-[var(--akdd-status-d-border)]">
                  {summary.dCount} D
                </Badge>
                <Badge className="bg-[var(--akdd-status-prestation-bg)] text-[var(--akdd-status-prestation-text)] border-[var(--akdd-status-prestation-border)]">
                  {summary.prestCount} PREST.
                </Badge>
                <Badge className="bg-[var(--akdd-status-input-bg)] text-[var(--akdd-status-input-text)] border-[var(--akdd-status-input-border)]">
                  {summary.otherCount} INPUT / CONTR.
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Analysis Engines — Hairline-Divided Monochrome Strip */}
      <section className="grid grid-cols-1 divide-y divide-[var(--akdd-border-subtle)] overflow-hidden rounded-[var(--akdd-radius-lg)] border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] shadow-none md:grid-cols-3 md:divide-x md:divide-y-0">
        {engines.map((e) => {
          const Icon = e.icon
          return (
            <Link
              key={e.to}
              to={e.to}
              className="group flex flex-col justify-between gap-5 p-6 transition-colors hover:bg-[var(--akdd-bg-subtle)]"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-[var(--akdd-text-primary)] stroke-[1.75]" />
                    {e.index} / Module
                  </span>
                  <span>{e.meta}</span>
                </div>
                <h2 className="font-display text-base font-bold tracking-[-0.03em] text-[var(--akdd-text-primary)]">
                  {e.title}
                </h2>
                <p className="text-xs leading-relaxed text-[var(--akdd-text-muted)]">{e.text}</p>
              </div>

              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.05em] text-[var(--akdd-text-primary)]">
                Ouvrir le moteur
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          )
        })}
      </section>

      {/* 10-Subsystem Architectural Hairline Matrix */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Architecture Propulsive — 10 Sous-Systèmes"
          subtitle="Sélectionnez un sous-système pour accéder au triptyque SPEC / TDB / TRACA"
        />
        <CardContent className="p-0">
          <div className="grid grid-cols-1 gap-px bg-[var(--akdd-border-subtle)] sm:grid-cols-2 lg:grid-cols-5">
            {SUBSYSTEM_CATALOG.map((sub) => {
              const stats = summary.bySub[sub.code]
              return (
                <Link
                  key={sub.code}
                  to={`/subsystems/${sub.code}`}
                  className="group flex flex-col justify-between gap-4 bg-[var(--akdd-bg-surface)] p-5 transition-colors hover:bg-[var(--akdd-bg-subtle)]"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <SubsystemBadge code={sub.code} />
                      <span className="font-mono text-[11px] font-semibold text-[var(--akdd-text-primary)]">
                        {stats?.total ?? 0} KDD
                      </span>
                    </div>
                    <h3 className="font-display text-sm font-bold tracking-[-0.02em] text-[var(--akdd-text-primary)]">
                      {sub.frenchName}
                    </h3>
                    <p className="text-xs leading-relaxed text-[var(--akdd-text-muted)]">
                      {sub.shortRole}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[var(--akdd-border-subtle)] pt-3 font-mono text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="rounded-[var(--akdd-radius-xs)] border border-[var(--akdd-status-kdd-border)] bg-[var(--akdd-status-kdd-bg)] px-1 py-0.5 font-semibold text-[var(--akdd-status-kdd-text)]">
                        K:{stats?.k ?? 0}
                      </span>
                      <span className="rounded-[var(--akdd-radius-xs)] border border-[var(--akdd-status-s-border)] bg-[var(--akdd-status-s-bg)] px-1 py-0.5 font-semibold text-[var(--akdd-status-s-text)]">
                        S:{stats?.s ?? 0}
                      </span>
                      <span className="rounded-[var(--akdd-radius-xs)] border border-[var(--akdd-status-d-border)] bg-[var(--akdd-status-d-bg)] px-1 py-0.5 text-[var(--akdd-status-d-text)]">
                        D:{stats?.d ?? 0}
                      </span>
                    </div>
                    <span className="uppercase text-[var(--akdd-text-muted)]">
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
