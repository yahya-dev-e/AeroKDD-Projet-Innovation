import type { ReactNode } from 'react'

export interface KpiCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  accentClassName?: string
  footer?: ReactNode
}

export function KpiCard({
  label,
  value,
  subtitle,
  icon,
  accentClassName = '',
  footer,
}: KpiCardProps) {
  const hasEdgeAccent = Boolean(
    accentClassName && !accentClassName.includes('navy') && !accentClassName.includes('accent-blue'),
  )

  return (
    <div
      className={`flex flex-col justify-between gap-3.5 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] ${
        hasEdgeAccent ? `border-l-2 ${accentClassName}` : ''
      } p-5 shadow-none`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
            {label}
          </span>
          <span className="font-display text-4xl font-semibold tracking-[-0.02em] leading-[1.05] tabular-nums text-[var(--akdd-text-primary)]">
            {value}
          </span>
        </div>
        {icon && (
          <span className="inline-flex shrink-0 text-[var(--akdd-text-muted)]" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      {(subtitle || footer) && (
        <div className="flex flex-col gap-1.5 border-t border-[var(--akdd-border-subtle)] pt-2.5">
          {subtitle && <p className="text-xs text-[var(--akdd-text-muted)]">{subtitle}</p>}
          {footer}
        </div>
      )}
    </div>
  )
}
