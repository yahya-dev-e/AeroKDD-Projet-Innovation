import { Menu, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getSubsystemMeta } from '../../types/subsystems'

export interface TopbarProps {
  kddCount: number
  relationCount: number
  onOpenCommandPalette: () => void
  onToggleSidebar: () => void
}

const SUBSYSTEM_SHORT_LABELS: Record<string, string> = {
  FAN: 'Soufflante',
  BOOSTER: 'Compresseur BP',
  HPC: 'Compresseur HP',
  COMB: 'Combustion',
  HPT: 'Turbine HP',
  LPT: 'Turbine BP',
  NOZZLE: 'Tuyère',
  COOLING: 'Refroidissement',
  ELECTRICAL: 'Électrique',
  OIL: 'Lubrification',
}

function getPageTitle(pathname: string, search: string): { section: string; title: string } {
  if (pathname === '/') {
    return { section: 'Accueil', title: 'Vue d’ensemble' }
  }
  if (pathname.startsWith('/subsystems/')) {
    const code = pathname.split('/')[2] ?? 'FAN'
    const meta = getSubsystemMeta(code)
    const shortLabel = SUBSYSTEM_SHORT_LABELS[meta.code] ?? meta.frenchName
    return { section: 'Module', title: `${meta.code} · ${shortLabel}` }
  }
  if (pathname.startsWith('/explore')) {
    return { section: 'Analyse', title: 'Explorateur KDD' }
  }
  if (pathname.startsWith('/top-down')) {
    return { section: 'Analyse', title: 'Analyse Top-Down' }
  }
  if (pathname.startsWith('/network')) {
    return { section: 'Graphes', title: 'Réseau global' }
  }
  if (pathname.startsWith('/manager')) {
    return { section: 'Référentiel', title: 'Gestionnaire KDD' }
  }
  if (pathname.startsWith('/repositories')) {
    return search.includes('tab=requirements')
      ? { section: 'Projet', title: 'Exigences & TRACA' }
      : { section: 'Référentiel', title: 'Bibliothèque & Sources' }
  }
  if (pathname.startsWith('/admin')) {
    return { section: 'Système', title: 'Administration' }
  }
  return { section: 'AeroKDD', title: 'Système' }
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
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-surface)] px-6 shadow-none lg:px-8">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Basculer la navigation"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-subtle)] text-[var(--akdd-text-primary)] hover:bg-[var(--akdd-bg-subtle)] cursor-pointer lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 whitespace-nowrap text-sm">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
            {section}
          </span>
          <span className="text-[var(--akdd-slate-300)]">/</span>
          <h1 className="font-display text-lg font-semibold tracking-[-0.02em] leading-[1.05] text-[var(--akdd-text-primary)]">
            {title}
          </h1>
        </div>
      </div>

      {/* Center: 1px-bordered Ctrl+K Search Trigger */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="flex w-full max-w-[280px] items-center justify-between gap-4 rounded-full border border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] px-3.5 py-1.5 text-xs text-[var(--akdd-text-muted)] shadow-none hover:border-[var(--akdd-ink)] hover:bg-[var(--akdd-bg-surface)] hover:text-[var(--akdd-text-primary)] transition-colors cursor-pointer"
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
      <div className="hidden md:flex shrink-0 items-center justify-end gap-2 whitespace-nowrap font-mono text-[11px] font-medium uppercase tracking-[0.08em] tabular-nums text-[var(--akdd-text-primary)]">
        <span className="h-1.5 w-1.5 bg-[var(--akdd-ink)]" aria-hidden="true" />
        <span>{kddCount.toLocaleString('fr-FR')} KDD</span>
        <span className="text-[var(--akdd-text-muted)]">·</span>
        <span>{relationCount.toLocaleString('fr-FR')} LIENS</span>
      </div>
    </header>
  )
}
