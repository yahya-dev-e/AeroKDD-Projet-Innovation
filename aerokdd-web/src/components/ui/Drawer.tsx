import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Button } from './Button'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  headerExtra?: ReactNode
  children: ReactNode
}

export function Drawer({ open, onClose, title, subtitle, headerExtra, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[rgb(9_9_11/0.4)]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-xl flex-col bg-[var(--akdd-bg-surface)] border-l border-[var(--akdd-border-subtle)] shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] px-7 py-5">
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-base font-semibold text-[var(--akdd-text-primary)]">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-[var(--akdd-text-muted)]">{subtitle}</p>}
            {headerExtra && <div className="flex flex-wrap items-center gap-2 pt-1">{headerExtra}</div>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fermer le panneau">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>
      </aside>
    </div>
  )
}
