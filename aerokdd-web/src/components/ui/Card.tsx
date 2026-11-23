import type { ReactNode } from 'react'

export interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <section
      className={`flex flex-col rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] shadow-none ${className}`}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] ${className}`}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <h2 className="text-sm font-medium text-[var(--akdd-text-primary)] truncate">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-[var(--akdd-text-muted)] truncate">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={`p-5 ${className}`}>{children}</div>
}
