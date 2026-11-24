import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Database,
  FileText,
  Layers,
  Link2,
  Target,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SubsystemCadThumbnail } from '../components/ui'
import heroBannerFallback from '../components/ui/assets/hero-turbofan-blueprint.png'
import {
  normalizeSubsystemCode,
  statutToShortCat,
} from '../engines/graphBuilder'
import { useAeroKddStore } from '../store/useAeroKddStore'
import { SUBSYSTEM_CATALOG } from '../types/subsystems'

const SUBSYSTEM_CARD_SUBTITLES: Record<string, string> = {
  FAN: 'Soufflante',
  BOOSTER: 'Compresseur BP',
  HPC: 'Compresseur HP',
  COMB: 'Chambre de combustion',
  HPT: 'Turbine HP',
  LPT: 'Turbine BP',
  NOZZLE: 'Tuyère d’éjection',
  COOLING: 'Refroidissement',
  ELECTRICAL: 'Système électrique',
  OIL: 'Système d’huile',
}

function Sparkline({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 76 28" className="h-7 w-20 shrink-0" fill="none" aria-hidden="true">
      <path d={`${path} L 74 27 L 2 27 Z`} fill="#2B5B84" fillOpacity="0.1" />
      <path
        d={path}
        stroke="#2B5B84"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function OverviewPage() {
  const { kdds, relations, bibliotheque, requirements } = useAeroKddStore()
  const [heroPublicFailed, setHeroPublicFailed] = useState(false)

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

  const recentFeed = useMemo(() => {
    const rows: Array<{
      id: string
      kddId: string
      kind: 'KDD' | 'REL' | 'SPEC'
      label: string
      time: string
    }> = []

    if (requirements.length > 0) {
      const latestReq = requirements[requirements.length - 1]
      if (latestReq) {
        rows.push({
          id: `req-${latestReq.id}`,
          kddId: latestReq.kddId || 'FAN-024',
          kind: 'SPEC',
          label: `Exigence ${latestReq.id} liée`,
          time: 'À l’instant',
        })
      }
    }

    const fanTarget = kdds.find((k) => k.id === 'FAN-024') ?? kdds[kdds.length - 1]
    const boosterRel =
      relations.find((r) => r.sourceId === 'BOOSTER-021' || r.targetId === 'BOOSTER-021') ??
      relations[relations.length - 1]
    const hpcTarget = kdds.find((k) => k.id === 'HPC-025') ?? kdds[Math.max(0, kdds.length - 2)]

    if (fanTarget) {
      rows.push({
        id: `kdd-${fanTarget.id}`,
        kddId: fanTarget.id,
        kind: 'KDD',
        label: 'Mise à jour des relations',
        time: 'Il y a 12 min',
      })
    }
    if (boosterRel) {
      const relKdd = boosterRel.sourceId.startsWith('BOOSTER')
        ? boosterRel.sourceId
        : boosterRel.targetId
      rows.push({
        id: `rel-${boosterRel.id}`,
        kddId: relKdd,
        kind: 'REL',
        label: 'Nouvelle relation validée',
        time: 'Il y a 28 min',
      })
    }
    if (hpcTarget) {
      rows.push({
        id: `spec-${hpcTarget.id}`,
        kddId: hpcTarget.id,
        kind: 'SPEC',
        label: 'Justification physique vérifiée',
        time: 'Il y a 1 h',
      })
    }

    return rows.slice(0, 3)
  }, [kdds, relations, requirements])

  const kpiCards = [
    {
      value: kdds.length.toLocaleString('fr-FR'),
      label: 'KDD',
      icon: Database,
      spark: 'M 2 22 Q 18 20, 30 16 T 54 10 T 74 13',
    },
    {
      value: relations.length.toLocaleString('fr-FR'),
      label: 'Liens actifs',
      icon: Link2,
      spark: 'M 2 23 L 18 19 L 33 21 L 50 12 L 63 14 L 74 7',
    },
    {
      value: SUBSYSTEM_CATALOG.length.toLocaleString('fr-FR'),
      label: 'Sous-systèmes',
      icon: Layers,
      spark: 'M 2 21 Q 22 18, 38 19 T 60 11 T 74 12',
    },
    {
      value: bibliotheque.length.toLocaleString('fr-FR'),
      label: 'Éléments bibliographiques',
      icon: Target,
      spark: 'M 2 22 L 19 18 L 36 19 L 53 11 L 65 13 L 74 8',
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-3.5">
      {/* 1. Compact Hero Banner (~210px height) */}
      <section className="relative min-h-[206px] w-full overflow-hidden rounded-xl border border-[#DCE5F0] bg-[#EEF3F9] shadow-[var(--akdd-shadow-sm)]">
        {/* Right-side Turbofan / Blueprint Visual */}
        <img
          src={heroPublicFailed ? heroBannerFallback : '/assets/hero-banner.png'}
          onError={() => {
            if (!heroPublicFailed) setHeroPublicFailed(true)
          }}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-full object-cover object-right sm:w-[74%]"
        />

        {/* Smooth Horizontal Fade from Left Slate into Right Turbofan Blueprint */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, #EEF3F9 0%, #EEF3F9 36%, rgba(238,243,249,0.92) 48%, rgba(238,243,249,0.28) 66%, rgba(15,29,50,0.22) 100%)',
          }}
        />

        {/* Subtle Left Blueprint Dot-Grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-75"
          style={{
            backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />

        <div className="relative z-10 flex min-h-[206px] flex-col justify-between gap-4 px-6 py-5 lg:px-8 lg:py-6">
          {/* Top Row: Title */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex max-w-xl flex-col gap-2">
              <h1 className="font-display text-4xl font-bold leading-none tracking-[-0.02em] text-[#0F1D32] sm:text-[44px]">
                AeroKDD
              </h1>
              <p className="text-[15px] font-medium leading-snug text-[#1E293B] sm:text-[17px]">
                Architecture propulsive, Key Design Drivers, traçabilité et ingénierie système
              </p>
              <p className="max-w-[500px] text-xs leading-relaxed text-[#475569]">
                Référentiel formel d’ingénierie système reliant les prestations cibles d’un
                turboréacteur aux leviers de dimensionnement, aux équations de couplage et à la
                traçabilité sur 10 sous-systèmes.
              </p>
            </div>
          </div>

          {/* Bottom-Right Pinned Dual Pill CTAs */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/network"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#0F1D32] bg-[#0F1D32] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#162947]"
              >
                <span>Explorer le réseau</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/top-down"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/15 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/25"
              >
                Analyse Top-Down
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4-Card KPI Strip */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3.5 shadow-[var(--akdd-shadow-sm)]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#2B5B84]">
                  <Icon className="h-[18px] w-[18px] stroke-[1.75]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-display text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-[#0F1D32]">
                    {kpi.value}
                  </span>
                  <span className="mt-1 truncate text-xs text-[#64748B]">{kpi.label}</span>
                </div>
              </div>
              <Sparkline path={kpi.spark} />
            </div>
          )
        })}
      </section>

      {/* 3. Les 10 sous-systèmes du turboréacteur (Full-Width 5x2 Grid) */}
      <section className="flex flex-col rounded-xl border border-[#E2E8F0] bg-white shadow-[var(--akdd-shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Layers className="h-4 w-4 text-[#2B5B84]" />
            <h2 className="text-[15px] font-semibold text-[#0F1D32]">
              Les 10 sous-systèmes du turboréacteur
            </h2>
          </div>
          <span className="font-mono text-xs tabular-nums text-[#64748B]">
            {kdds.length.toLocaleString('fr-FR')} KDD ·{' '}
            <strong className="font-medium text-[#0F1D32]">
              {relations.length.toLocaleString('fr-FR')}
            </strong>{' '}
            liens
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          {SUBSYSTEM_CATALOG.map((sub) => {
            const stats = summary.bySub[sub.code]
            const subtitle = SUBSYSTEM_CARD_SUBTITLES[sub.code] ?? sub.frenchName
            return (
              <Link
                key={sub.code}
                to={`/subsystems/${sub.code}`}
                className="group relative flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-3.5 transition-colors hover:border-[#2B5B84] hover:bg-[#F8FAFC]"
              >
                <ArrowUpRight className="absolute top-3 right-3 h-3.5 w-3.5 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0F1D32]" />

                <div className="flex flex-col gap-2 pt-1">
                  <SubsystemCadThumbnail code={sub.code} />
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-medium tracking-[0.03em] text-[#0F1D32]">
                      {sub.code}
                    </span>
                    <span className="truncate text-xs text-[#64748B]">{subtitle}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 border-t border-[#E2E8F0] pt-2.5 font-mono text-[11px] tabular-nums text-[#64748B]">
                  <FileText className="h-3 w-3 shrink-0 text-[#94A3B8]" />
                  <span>
                    <strong className="font-medium text-[#0F1D32]">{stats?.total ?? 0}</strong> KDD
                    · {stats?.links ?? 0} liens
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 4. Activité récente (Compact Horizontal Strip) */}
      <section className="flex flex-col rounded-xl border border-[#E2E8F0] bg-white shadow-[var(--akdd-shadow-sm)]">
        <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] px-5 py-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#2B5B84]" />
            <h2 className="text-sm font-semibold text-[#0F1D32]">Activité récente</h2>
          </div>
          <Link
            to="/repositories"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#475569] hover:text-[#0F1D32]"
          >
            <span>Tout l’historique</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 divide-y divide-[#E2E8F0] md:grid-cols-3 md:divide-x md:divide-y-0">
          {recentFeed.map((entry) => (
            <Link
              key={entry.id}
              to={`/explore/${encodeURIComponent(entry.kddId)}`}
              className="flex items-center justify-between gap-3 px-5 py-3 text-xs transition-colors hover:bg-[#F8FAFC]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {entry.kind === 'KDD' ? (
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#A7E3BF] bg-[#F6FEF9] font-mono text-[10px] font-medium text-[#0F5132]">
                    K
                  </span>
                ) : entry.kind === 'REL' ? (
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#ADC8F0] bg-[#F5F9FF] text-[#173F7A]">
                    <Link2 className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#CBD5E1] bg-[#F8FAFC] text-[#334155]">
                    <FileText className="h-3 w-3" />
                  </span>
                )}
                <span className="truncate text-[#475569]">
                  <strong className="font-mono font-medium text-[#0F1D32]">{entry.kddId}</strong> ·{' '}
                  {entry.label}
                </span>
              </div>
              <span className="shrink-0 whitespace-nowrap font-mono text-[10.5px] text-[#94A3B8]">
                {entry.time}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
