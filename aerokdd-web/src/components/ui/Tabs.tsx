import type { ReactNode } from 'react'

export interface TabItem<T extends string> {
  id: T
  label: string
  badge?: string | number
  icon?: ReactNode
}

export interface TabsProps<T extends string> {
  tabs: TabItem<T>[]
  activeTab: T
  onChange: (id: T) => void
}

export function Tabs<T extends string>({ tabs, activeTab, onChange }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className="inline-flex flex-wrap items-center gap-1 rounded-full bg-[var(--akdd-bg-subtle)] p-1 border border-[var(--akdd-border-subtle)] shadow-none"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-medium transition-colors shadow-none cursor-pointer ${
              isActive
                ? 'bg-[var(--akdd-ink)] text-[var(--akdd-text-inverse)] border border-[var(--akdd-ink)]'
                : 'border border-transparent text-[var(--akdd-text-muted)] hover:text-[var(--akdd-text-primary)]'
            }`}
          >
            {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                  isActive
                    ? 'bg-[var(--akdd-ink-hover)] text-[var(--akdd-text-inverse)]'
                    : 'bg-[var(--akdd-bg-surface)] text-[var(--akdd-text-muted)] border border-[var(--akdd-border-subtle)]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
