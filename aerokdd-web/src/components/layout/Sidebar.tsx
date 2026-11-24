import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Compass,
  FolderKanban,
  GitBranch,
  Home,
  Layers,
  Network,
  Settings,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { SUBSYSTEM_CATALOG } from '../../types/subsystems'

const SUBSYSTEM_SHORT_NAMES: Record<string, string> = {
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

export interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  kddCountBySubsystem: Record<string, number>
}

export function Sidebar({ collapsed, onToggleCollapse, kddCountBySubsystem }: SidebarProps) {
  const location = useLocation()
  const isSubsystemRoute = location.pathname.startsWith('/subsystems')
  const [subsystemsOpen, setSubsystemsOpen] = useState(isSubsystemRoute)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors shadow-none ${
      isActive
        ? 'border-[#0F1D32] bg-[#0F1D32] text-white'
        : 'border-transparent text-[var(--akdd-text-secondary)] hover:bg-[var(--akdd-slate-100)] hover:text-[var(--akdd-text-primary)]'
    }`

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col bg-[#F8FAFC] text-[var(--akdd-text-primary)] border-r border-[#E2E8F0] shadow-none transition-[width] duration-150 ${
        collapsed ? 'w-[68px]' : 'w-[244px]'
      }`}
    >
      {/* Brand Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#E2E8F0] px-3.5 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white text-[#0F1D32]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" stroke="#0F1D32" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="2.2" fill="#2B5B84" />
              <path
                d="M12 3.8V8.5M12 15.5V20.2M3.8 12H8.5M15.5 12H20.2M6.2 6.2L9.5 9.5M14.5 14.5L17.8 17.8M17.8 6.2L14.5 9.5M9.5 14.5L6.2 17.8"
                stroke="#2B5B84"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-display text-xl font-semibold tracking-[-0.02em] leading-none text-[#0F1D32] truncate">
                AeroKDD
              </span>
              <span className="mt-1 inline-flex items-center gap-1 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-[#2B5B84] truncate">
                <span className="text-[#64748B] lowercase">by</span> SHERPA ENGINEERING
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-[var(--akdd-text-muted)] hover:border-[#E2E8F0] hover:bg-white hover:text-[#0F1D32] cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Clean Non-Duplicated Navigation */}
      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3.5">
        <div className="flex flex-col gap-1">
          <NavLink to="/" end className={linkClass} title="Vue d’ensemble">
            <Home className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Vue d’ensemble</span>}
          </NavLink>

          {/* Collapsible 10 Subsystems */}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                if (!collapsed) setSubsystemsOpen((v) => !v)
              }}
              aria-expanded={subsystemsOpen}
              aria-controls="sidebar-subsystems"
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors shadow-none cursor-pointer ${
                isSubsystemRoute
                  ? 'border-[#0F1D32] bg-[#0F1D32] text-white'
                  : 'border-transparent text-[var(--akdd-text-secondary)] hover:bg-[var(--akdd-slate-100)] hover:text-[var(--akdd-text-primary)]'
              }`}
              title="Sous-systèmes (10)"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Layers className="h-4 w-4 shrink-0 stroke-[1.75]" />
                {!collapsed && <span className="truncate">Sous-systèmes (10)</span>}
              </span>
              {!collapsed &&
                (subsystemsOpen ? (
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isSubsystemRoute
                        ? 'text-[var(--akdd-slate-300)]'
                        : 'text-[var(--akdd-text-muted)]'
                    }`}
                  />
                ) : (
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isSubsystemRoute
                        ? 'text-[var(--akdd-slate-300)]'
                        : 'text-[var(--akdd-text-muted)]'
                    }`}
                  />
                ))}
            </button>

            {!collapsed && subsystemsOpen && (
              <div
                id="sidebar-subsystems"
                className="ml-4 flex max-h-[212px] flex-col overflow-y-auto border-l border-[#E2E8F0] py-0.5"
              >
                {SUBSYSTEM_CATALOG.map((sub) => (
                  <NavLink
                    key={sub.code}
                    to={`/subsystems/${sub.code}`}
                    className={({ isActive }) =>
                      `-ml-px flex items-center justify-between gap-2 border-l-2 pl-3 pr-2.5 py-1 text-[11.5px] font-medium leading-tight transition-colors ${
                        isActive
                          ? 'border-[#0F1D32] bg-[#EEF2F7] text-[#0F1D32]'
                          : 'border-transparent text-[var(--akdd-text-secondary)] hover:border-[var(--akdd-slate-300)] hover:text-[var(--akdd-text-primary)]'
                      }`
                    }
                  >
                    <span className="truncate">
                      <span className="font-mono text-[11px] font-medium">{sub.code}</span>
                      <span className="text-[var(--akdd-text-muted)]">
                        {' '}
                        · {SUBSYSTEM_SHORT_NAMES[sub.code] ?? sub.frenchName}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--akdd-text-muted)]">
                      {kddCountBySubsystem[sub.code] ?? 0}
                    </span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <NavLink to="/explore" className={linkClass} title="Explorateur KDD">
            <Compass className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Explorateur KDD</span>}
          </NavLink>
          <NavLink to="/top-down" className={linkClass} title="Analyse Top-Down">
            <GitBranch className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Analyse Top-Down</span>}
          </NavLink>
          <NavLink to="/network" className={linkClass} title="Réseau global">
            <Network className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Réseau global</span>}
          </NavLink>
        </div>

        <div className="border-t border-[#E2E8F0]" />

        {/* Governance & Repositories */}
        <div className="flex flex-col gap-1">
          <NavLink to="/manager" className={linkClass} title="Gestionnaire KDD">
            <FolderKanban className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Gestionnaire KDD</span>}
          </NavLink>
          <NavLink
            to="/repositories?tab=requirements"
            className={() =>
              linkClass({
                isActive:
                  location.pathname === '/repositories' &&
                  location.search.includes('tab=requirements'),
              })
            }
            title="Instanciation projet (Exigences & TRACA)"
          >
            <ClipboardCheck className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Exigences & TRACA</span>}
          </NavLink>
          <NavLink
            to="/repositories?tab=bibliotheque"
            className={() =>
              linkClass({
                isActive:
                  location.pathname === '/repositories' &&
                  !location.search.includes('tab=requirements'),
              })
            }
            title="Bibliothèque & sources scientifiques"
          >
            <BookOpen className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Bibliothèque & Sources</span>}
          </NavLink>
          <NavLink to="/admin" className={linkClass} title="Administration & maintenance">
            <Settings className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Administration</span>}
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-[#E2E8F0] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--akdd-text-muted)]">
          <span>ECC × SHERPA · RÉV. 2.0</span>
        </div>
      )}
    </aside>
  )
}
