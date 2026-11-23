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
    'bg-[var(--akdd-navy-700)] text-[var(--akdd-text-inverse)] border border-[var(--akdd-navy-700)] shadow-[var(--akdd-shadow-sm)] hover:bg-[var(--akdd-navy-900)]',
  secondary:
    'bg-[var(--akdd-bg-surface)] text-[var(--akdd-text-primary)] border border-[var(--akdd-border-default)] shadow-[var(--akdd-shadow-sm)] hover:bg-[var(--akdd-slate-50)]',
  ghost:
    'bg-transparent text-[var(--akdd-text-secondary)] border border-transparent hover:bg-[var(--akdd-slate-100)] hover:text-[var(--akdd-text-primary)]',
  danger:
    'bg-[var(--akdd-status-contrainte-bg)] text-[var(--akdd-status-contrainte-text)] border border-[var(--akdd-status-contrainte-border)] hover:opacity-90',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-3.5 py-2 text-sm gap-2',
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
      className={`inline-flex items-center justify-center rounded-[var(--akdd-radius-sm)] font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:shadow-[var(--akdd-focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
