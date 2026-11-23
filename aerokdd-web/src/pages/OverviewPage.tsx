import { ArrowUpRight } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { normalizeSubsystemCode, statutToShortCat } from '../engines/graphBuilder'
import { useAeroKddStore } from '../store/useAeroKddStore'
import { SUBSYSTEM_CATALOG } from '../types/subsystems'

export function OverviewPage() {
  const { kdds, relations, bibliotheque } = useAeroKddStore()

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

  const telemetryCounters = [
    { value: SUBSYSTEM_CATALOG.length.toLocaleString('fr-FR'), label: 'Sous-systèmes' },
    { value: kdds.length.toLocaleString('fr-FR'), label: 'KDD' },
    { value: relations.length.toLocaleString('fr-FR'), label: 'Liens actifs' },
    { value: bibliotheque.length.toLocaleString('fr-FR'), label: 'Bibliothèque' },
  ]

  return (
    <div className="flex min-h-full flex-col bg-[var(--akdd-bg-canvas)]">
      {/* 1. Hero Section — Full-width white canvas with 16px dot-matrix grid */}
      <section
        className="w-full bg-[var(--akdd-bg-canvas)] px-6 py-12 lg:px-10"
        style={{
          backgroundImage: 'radial-gradient(#D4D4D8 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
            SPEC · TDB · TRACA · Référentiel Système Turboréacteur
          </span>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[var(--akdd-ink)] sm:text-5xl lg:text-[54px]">
            AeroKDD — Architecture Propulsive &amp; Key Design Drivers
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-[var(--akdd-text-muted)] sm:text-[15px]">
            Référentiel formel d’ingénierie système reliant les prestations cibles d’un
            turboréacteur double flux aux leviers de dimensionnement, équations de couplage et
            matrices de traçabilité sur 10 sous-systèmes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              to="/network"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--akdd-ink)] bg-[var(--akdd-ink)] px-6 py-2.5 text-xs font-medium tracking-[-0.01em] text-[var(--akdd-text-inverse)] shadow-none transition-colors hover:bg-[var(--akdd-ink-hover)]"
            >
              <span>Explorer le réseau</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/top-down"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-6 py-2.5 text-xs font-medium tracking-[-0.01em] text-[var(--akdd-ink)] shadow-none transition-colors hover:border-[var(--akdd-ink)] hover:bg-[var(--akdd-bg-subtle)]"
            >
              Analyse Top-Down
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Partner & Telemetry Strip */}
      <section className="w-full border-y border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)]">
        <div className="mx-auto flex max-w-7xl flex-col divide-y divide-[var(--akdd-border-subtle)] xl:flex-row xl:items-center xl:justify-between xl:divide-y-0">
          <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap px-6 py-3 lg:px-10">
            <span className="h-1.5 w-1.5 shrink-0 bg-[var(--akdd-ink)]" aria-hidden="true" />
            <span className="text-xs font-medium text-[var(--akdd-ink)]">
              École Centrale Casablanca × SHERPA Engineering
            </span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-[var(--akdd-border-subtle)] sm:grid-cols-4 xl:flex xl:items-center xl:border-l xl:border-[var(--akdd-border-subtle)]">
            {telemetryCounters.map((item) => (
              <div
                key={item.label}
                className="flex items-baseline gap-1.5 whitespace-nowrap px-4 py-3 font-mono text-xs tabular-nums xl:px-5"
              >
                <span className="font-medium text-[var(--akdd-ink)]">{item.value}</span>
                <span className="text-[11px] text-[var(--akdd-text-muted)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Subsystem Index — Sharp Border-Collapsed 10-Subsystem Swiss Grid */}
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-7 lg:px-10 lg:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
              Index / Architecture Propulsive
            </span>
            <h2 className="text-base font-semibold text-[var(--akdd-ink)]">
              10 Sous-systèmes du turboréacteur
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] tabular-nums text-[var(--akdd-text-muted)]">
            <span>
              {summary.kCount} KDD · {summary.sCount} S · {summary.dCount} D · {summary.prestCount}{' '}
              PREST.
            </span>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1 text-[var(--akdd-ink)] hover:underline"
            >
              Explorateur KDD <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 border-t border-l border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] sm:grid-cols-2 lg:grid-cols-5">
          {SUBSYSTEM_CATALOG.map((sub, idx) => {
            const stats = summary.bySub[sub.code]
            const indexCode = `${String(idx + 1).padStart(2, '0')} / ${sub.code}`
            return (
              <Link
                key={sub.code}
                to={`/subsystems/${sub.code}`}
                className="group flex flex-col justify-between gap-6 border-r border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] p-5 transition-colors hover:bg-[var(--akdd-bg-subtle)]"
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] tabular-nums text-[var(--akdd-ink)]">
                      {indexCode}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--akdd-slate-400)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--akdd-ink)]" />
                  </div>

                  <h3 className="text-sm font-medium text-[var(--akdd-ink)]">
                    {sub.frenchName}
                  </h3>
                  <p className="text-xs leading-relaxed text-[var(--akdd-text-muted)]">
                    {sub.shortRole}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[var(--akdd-border-subtle)] pt-3 font-mono text-[11px] tabular-nums">
                  <span className="font-medium text-[var(--akdd-ink)]">
                    {stats?.total ?? 0} KDD
                  </span>
                  <span className="text-[11px] text-[var(--akdd-text-muted)]">
                    {stats?.links ?? 0} liens
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
