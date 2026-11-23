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
  accentClassName = 'border-l-[var(--akdd-navy-700)]',
  footer,
}: KpiCardProps) {
  return (
    <div
      className={`flex flex-col justify-between gap-3 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] border-l-4 ${accentClassName} p-4 shadow-[var(--akdd-shadow-sm)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--akdd-text-muted)]">
            {label}
          </span>
          <span className="text-2xl font-bold tracking-tight text-[var(--akdd-text-primary)] font-mono">
            {value}
          </span>
        </div>
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-subtle)] text-[var(--akdd-navy-700)]">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || footer) && (
        <div className="flex flex-col gap-1.5 border-t border-[var(--akdd-border-subtle)] pt-2.5">
          {subtitle && <p className="text-xs text-[var(--akdd-text-secondary)]">{subtitle}</p>}
          {footer}
        </div>
      )}
    </div>
  )
}
