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
      className={`inline-flex items-center gap-1 rounded-[var(--akdd-radius-xs)] px-1.5 py-0.5 font-mono text-[10.5px] font-medium leading-tight tracking-[0.02em] whitespace-nowrap border shadow-none ${className}`}
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
  return 'bg-[var(--akdd-bg-subtle)] text-[var(--akdd-text-secondary)] border-[var(--akdd-border-subtle)]'
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

export function SubsystemBadge({ code }: { code: string }) {
  return (
    <Badge
      className="bg-[var(--akdd-bg-subtle)] text-[var(--akdd-text-primary)] border-[var(--akdd-border-subtle)] font-mono font-semibold uppercase tracking-[0.05em]"
    >
      {code}
    </Badge>
  )
}
