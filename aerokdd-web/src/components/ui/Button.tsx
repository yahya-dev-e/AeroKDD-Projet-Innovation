import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--akdd-ink)] text-[var(--akdd-text-inverse)] border border-[var(--akdd-ink)] shadow-none hover:bg-[var(--akdd-ink-hover)] hover:border-[var(--akdd-ink-hover)]',
  secondary:
    'bg-[var(--akdd-bg-surface)] text-[var(--akdd-text-primary)] border border-[var(--akdd-border-subtle)] shadow-none hover:border-[var(--akdd-ink)] hover:bg-[var(--akdd-bg-subtle)]',
  ghost:
    'bg-transparent text-[var(--akdd-text-secondary)] border border-transparent shadow-none hover:bg-[var(--akdd-slate-100)] hover:text-[var(--akdd-text-primary)]',
  danger:
    'bg-[var(--akdd-status-contrainte-bg)] text-[var(--akdd-status-contrainte-text)] border border-[var(--akdd-status-contrainte-border)] shadow-none hover:border-[var(--akdd-status-contrainte-text)]',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-xs gap-2',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-full font-medium tracking-[-0.01em] transition-colors cursor-pointer focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--akdd-ink)] disabled:opacity-45 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
