import { Database, Link2, Menu, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getSubsystemMeta } from '../../types/subsystems'

export interface TopbarProps {
  kddCount: number
  elementCount: number
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
  elementCount,
  relationCount,
  onOpenCommandPalette,
  onToggleSidebar,
}: TopbarProps) {
  const location = useLocation()
  const { title } = getPageTitle(location.pathname, location.search)

  return (
    <header className="flex h-13 shrink-0 items-center justify-between gap-4 border-b border-[#E2E8F0] bg-[#FFFFFF] px-5 shadow-none lg:px-6">
      {/* Left: AeroKDD | Page Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Basculer la navigation"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] text-[#0F1D32] hover:bg-[#F8FAFC] cursor-pointer lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2.5 whitespace-nowrap text-sm">
          <span className="font-semibold tracking-[-0.01em] text-[#0F1D32]">AeroKDD</span>
          <span className="h-3.5 w-px bg-[#CBD5E1]" aria-hidden="true" />
          <h1 className="font-sans text-sm font-normal tracking-normal leading-normal text-[#475569]">
            {title}
          </h1>
        </div>
      </div>

      {/* Center: 1px-bordered Ctrl+K Search Trigger */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="flex w-full max-w-[320px] items-center justify-between gap-4 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-1.5 text-xs text-[#64748B] shadow-none hover:border-[#2B5B84] hover:bg-white hover:text-[#0F1D32] transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2 truncate">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
          <span className="truncate">Rechercher un KDD...</span>
        </span>
        <kbd className="shrink-0 rounded-full border border-[#E2E8F0] bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-[#0F1D32]">
          Ctrl+K
        </kbd>
      </button>

      {/* Right: Monospace System Telemetry */}
      <div className="hidden md:flex shrink-0 items-center justify-end gap-2.5 whitespace-nowrap font-mono text-[11.5px] font-medium uppercase tracking-[0.04em] tabular-nums text-[#0F1D32]">
        <span
          className="inline-flex items-center gap-1.5"
          title={`${kddCount} vrais Key Design Drivers sur ${elementCount} éléments SPEC`}
        >
          <Database className="h-3.5 w-3.5 text-[#2B5B84]" />
          <span>{kddCount.toLocaleString('fr-FR')} KDD</span>
          <span className="text-[10.5px] font-normal text-[#64748B]">
            / {elementCount.toLocaleString('fr-FR')} ÉLÉM.
          </span>
        </span>
        <span className="text-[#CBD5E1]">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5 text-[#2B5B84]" />
          <span>{relationCount.toLocaleString('fr-FR')} LIENS</span>
        </span>
      </div>
    </header>
  )
}
