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
    <header className="grid h-14 shrink-0 grid-cols-[1fr_auto] items-center gap-4 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-6 shadow-none md:grid-cols-[1fr_auto_1fr] lg:px-8">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Basculer la navigation"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-subtle)] text-[var(--akdd-text-primary)] hover:bg-[var(--akdd-bg-subtle)] cursor-pointer lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 min-w-0 text-sm">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--akdd-text-muted)] shrink-0">
            {section}
          </span>
          <span className="text-[var(--akdd-slate-300)] shrink-0">/</span>
          <h1 className="font-display text-lg font-semibold tracking-[-0.02em] leading-[1.05] text-[var(--akdd-text-primary)] truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Center: 1px-bordered Ctrl+K Search Trigger */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="flex items-center justify-between gap-6 rounded-full border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] px-3.5 py-1.5 text-xs text-[var(--akdd-text-muted)] shadow-none hover:border-[var(--akdd-ink)] hover:bg-[var(--akdd-bg-surface)] hover:text-[var(--akdd-text-primary)] transition-colors cursor-pointer min-w-[210px] lg:min-w-[300px]"
      >
        <span className="flex items-center gap-2 truncate">
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--akdd-text-muted)]" />
          <span className="truncate">Rechercher un KDD…</span>
        </span>
        <kbd className="shrink-0 rounded-full border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--akdd-text-primary)]">
          Ctrl+K
        </kbd>
      </button>

      {/* Right: Monospace System Telemetry */}
      <div className="hidden md:flex items-center justify-end gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] tabular-nums text-[var(--akdd-text-primary)]">
        <span className="h-1.5 w-1.5 bg-[var(--akdd-ink)]" aria-hidden="true" />
        <span>{kddCount.toLocaleString('en-US')} KDDs</span>
        <span className="text-[var(--akdd-text-muted)]">·</span>
        <span>{relationCount.toLocaleString('en-US')} LIENS</span>
      </div>
    </header>
  )
}
