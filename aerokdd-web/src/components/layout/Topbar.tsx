import { Menu, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getSubsystemMeta } from '../../types/subsystems'

export interface TopbarProps {
  kddCount: number
  relationCount: number
  onOpenCommandPalette: () => void
  onToggleSidebar: () => void
}

function getPageTitle(pathname: string, search: string): { section: string; title: string } {
  if (pathname === '/') {
    return { section: 'AeroKDD', title: 'Vue d’ensemble du Référentiel' }
  }
  if (pathname.startsWith('/subsystems/')) {
    const code = pathname.split('/')[2] ?? 'FAN'
    const meta = getSubsystemMeta(code)
    return { section: 'Sous-Système', title: `${meta.code} — ${meta.frenchName}` }
  }
  if (pathname.startsWith('/explore')) {
    return { section: 'Analyse', title: 'Unit Explorer (GRAPH_KDD & SCHEMA KDD)' }
  }
  if (pathname.startsWith('/top-down')) {
    return { section: 'Analyse', title: 'Moteur d’Analyse Top-Down' }
  }
  if (pathname.startsWith('/network')) {
    return { section: 'Cartographie', title: 'Global Network (10 Sous-Systèmes)' }
  }
  if (pathname.startsWith('/manager')) {
    return { section: 'Référentiel', title: 'KDD Manager' }
  }
  if (pathname.startsWith('/repositories')) {
    return search.includes('tab=requirements')
      ? { section: 'Instanciation Projet', title: 'Requirements & TRACA' }
      : { section: 'Références', title: 'Bibliothèque & Sources' }
  }
  if (pathname.startsWith('/admin')) {
    return { section: 'Maintenance', title: 'Administration & Export' }
  }
  return { section: 'AeroKDD', title: 'Design System' }
}

export function Topbar({
  kddCount,
  relationCount,
  onOpenCommandPalette,
  onToggleSidebar,
}: TopbarProps) {
  const location = useLocation()
  const { section, title } = getPageTitle(location.pathname, location.search)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-5 shadow-[var(--akdd-shadow-sm)]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Basculer la navigation"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--akdd-radius-sm)] text-[var(--akdd-text-secondary)] hover:bg-[var(--akdd-slate-100)] cursor-pointer lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 min-w-0 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--akdd-text-muted)] shrink-0">
            {section}
          </span>
          <span className="text-[var(--akdd-slate-300)] shrink-0">/</span>
          <h1 className="font-semibold tracking-tight text-[var(--akdd-text-primary)] truncate">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between gap-4 rounded-[var(--akdd-radius-md)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-3 py-1.5 text-xs text-[var(--akdd-text-secondary)] shadow-[inset_0_1px_1px_rgb(15_23_42/0.03)] hover:border-[var(--akdd-navy-600)] hover:text-[var(--akdd-text-primary)] transition-all cursor-pointer min-w-[220px]"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[var(--akdd-text-muted)]" />
            <span>Rechercher un KDD…</span>
          </span>
          <kbd className="rounded bg-[var(--akdd-bg-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--akdd-text-muted)] border border-[var(--akdd-border-subtle)]">
            Ctrl K
          </kbd>
        </button>

        <div className="hidden md:flex items-center gap-2 rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-subtle)] px-3 py-1.5 text-xs font-mono text-[var(--akdd-navy-800)] border border-[var(--akdd-border-subtle)]">
          <span>{kddCount} KDDs</span>
          <span className="text-[var(--akdd-slate-300)]">·</span>
          <span>{relationCount} liens</span>
        </div>
      </div>
    </header>
  )
}
