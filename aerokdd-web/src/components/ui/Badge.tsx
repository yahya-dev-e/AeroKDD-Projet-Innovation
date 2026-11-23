import type { ReactNode } from 'react'
import type { CentralityLevel } from '../../engines/topDownEngine'
import type { KddClassification, StatutKdd } from '../../types/aerokdd'

export interface BadgeProps {
  children: ReactNode
  className?: string
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[var(--akdd-radius-xs)] px-2 py-0.5 text-xs font-medium leading-tight whitespace-nowrap border ${className}`}
    >
      {children}
    </span>
  )
}

export function getStatutStyleClasses(statut: StatutKdd | string): string {
  const s = (statut || '').toUpperCase()
  if (s.startsWith('KDD')) {
    return 'bg-[var(--akdd-status-kdd-bg)] text-[var(--akdd-status-kdd-text)] border-[var(--akdd-status-kdd-border)] font-semibold'
  }
  if (s.startsWith('S -') || s === 'S') {
    return 'bg-[var(--akdd-status-s-bg)] text-[var(--akdd-status-s-text)] border-[var(--akdd-status-s-border)] font-semibold'
  }
  if (s.startsWith('D -') || s === 'D') {
    return 'bg-[var(--akdd-status-d-bg)] text-[var(--akdd-status-d-text)] border-[var(--akdd-status-d-border)]'
  }
  if (s.startsWith('EFFET INDUIT')) {
    return 'bg-[var(--akdd-status-effet-bg)] text-[var(--akdd-status-effet-text)] border-[var(--akdd-status-effet-border)]'
  }
  if (s.startsWith('PRESTATION')) {
    return 'bg-[var(--akdd-status-prestation-bg)] text-[var(--akdd-status-prestation-text)] border-[var(--akdd-status-prestation-border)]'
  }
  if (s.startsWith('INPUT')) {
    return 'bg-[var(--akdd-status-input-bg)] text-[var(--akdd-status-input-text)] border-[var(--akdd-status-input-border)]'
  }
  if (s.startsWith('CONTRAINT')) {
    return 'bg-[var(--akdd-status-contrainte-bg)] text-[var(--akdd-status-contrainte-text)] border-[var(--akdd-status-contrainte-border)]'
  }
  return 'bg-[var(--akdd-slate-100)] text-[var(--akdd-slate-700)] border-[var(--akdd-border-default)]'
}

export function StatutBadge({ statut }: { statut: StatutKdd | string }) {
  return <Badge className={getStatutStyleClasses(statut)}>{statut || 'Non classé'}</Badge>
}

export function KsdBadge({ value }: { value: KddClassification | string }) {
  const v = (value || '').toUpperCase()
  if (v === 'K') {
    return (
      <Badge className="bg-[var(--akdd-status-kdd-bg)] text-[var(--akdd-status-kdd-text)] border-[var(--akdd-status-kdd-border)] font-bold">
        K
      </Badge>
    )
  }
  if (v === 'S') {
    return (
      <Badge className="bg-[var(--akdd-status-s-bg)] text-[var(--akdd-status-s-text)] border-[var(--akdd-status-s-border)] font-bold">
        S
      </Badge>
    )
  }
  if (v === 'D') {
    return (
      <Badge className="bg-[var(--akdd-status-d-bg)] text-[var(--akdd-status-d-text)] border-[var(--akdd-status-d-border)] font-semibold">
        D
      </Badge>
    )
  }
  return (
    <Badge className="bg-[var(--akdd-slate-100)] text-[var(--akdd-slate-500)] border-[var(--akdd-border-subtle)]">
      —
    </Badge>
  )
}

export function CentralityBadge({ level, label }: { level: CentralityLevel; label?: string }) {
  const classes =
    level === 'CARREFOUR'
      ? 'bg-[var(--akdd-badge-carrefour-bg)] text-[var(--akdd-badge-carrefour-text)] border-[var(--akdd-badge-carrefour-border)] font-bold'
      : level === 'FORT'
        ? 'bg-[var(--akdd-badge-fort-bg)] text-[var(--akdd-badge-fort-text)] border-[var(--akdd-badge-fort-border)] font-semibold'
        : 'bg-[var(--akdd-badge-cible-bg)] text-[var(--akdd-badge-cible-text)] border-[var(--akdd-badge-cible-border)]'

  return <Badge className={classes}>{label ?? level}</Badge>
}

const SUBSYSTEM_BG_VARS: Record<string, string> = {
  FAN: 'bg-[var(--akdd-sys-fan)]',
  BOOSTER: 'bg-[var(--akdd-sys-booster)]',
  HPC: 'bg-[var(--akdd-sys-hpc)]',
  COMB: 'bg-[var(--akdd-sys-comb)]',
  HPT: 'bg-[var(--akdd-sys-hpt)]',
  LPT: 'bg-[var(--akdd-sys-lpt)]',
  NOZZLE: 'bg-[var(--akdd-sys-nozzle)]',
  COOLING: 'bg-[var(--akdd-sys-cooling)]',
  ELECTRICAL: 'bg-[var(--akdd-sys-electrical)]',
  OIL: 'bg-[var(--akdd-sys-oil)]',
}

export function SubsystemBadge({ code }: { code: string }) {
  const bg = SUBSYSTEM_BG_VARS[code.toUpperCase()] ?? 'bg-[var(--akdd-slate-100)]'
  return (
    <Badge
      className={`${bg} text-[var(--akdd-slate-900)] border-[var(--akdd-border-default)] font-mono font-semibold`}
    >
      {code}
    </Badge>
  )
}
