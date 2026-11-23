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
      className="inline-flex flex-wrap items-center gap-1 rounded-[var(--akdd-radius-md)] bg-[var(--akdd-slate-100)] p-1 border border-[var(--akdd-border-subtle)]"
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
            className={`inline-flex items-center gap-2 rounded-[var(--akdd-radius-sm)] px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer ${
              isActive
                ? 'bg-[var(--akdd-bg-surface)] text-[var(--akdd-navy-900)] shadow-[var(--akdd-shadow-sm)]'
                : 'text-[var(--akdd-text-secondary)] hover:text-[var(--akdd-text-primary)]'
            }`}
          >
            {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-mono ${
                  isActive
                    ? 'bg-[var(--akdd-accent-blue-soft)] text-[var(--akdd-navy-700)]'
                    : 'bg-[var(--akdd-slate-200)] text-[var(--akdd-slate-600)]'
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
