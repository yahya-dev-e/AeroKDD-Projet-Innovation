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
    `group flex items-center gap-3 rounded-[var(--akdd-radius-md)] border px-3 py-2 text-sm font-medium transition-all ${
      isActive
        ? 'border-[var(--akdd-sidebar-active-border)] bg-[var(--akdd-bg-sidebar-active)] text-[var(--akdd-text-inverse)] shadow-[inset_3px_0_0_var(--akdd-accent-blue)]'
        : 'border-transparent text-[var(--akdd-slate-300)] hover:bg-[var(--akdd-bg-sidebar-raised)] hover:text-[var(--akdd-text-inverse)]'
    }`

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col bg-[var(--akdd-bg-sidebar)] text-[var(--akdd-text-inverse)] border-r border-[var(--akdd-slate-800)] shadow-[var(--akdd-shadow-md)] transition-[width] duration-200 ${
        collapsed ? 'w-[72px]' : 'w-[264px]'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--akdd-slate-800)] px-3.5 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-sidebar-active)] text-xs font-bold tracking-tight text-[var(--akdd-text-inverse)] border border-[var(--akdd-sidebar-active-border)] shadow-[var(--akdd-shadow-sm)]">
            AK
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-[var(--akdd-text-inverse)] truncate">
                AeroKDD
              </span>
              <span className="text-[11px] text-[var(--akdd-slate-400)] truncate">
                ECC × SHERPA Engineering
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--akdd-radius-xs)] text-[var(--akdd-slate-400)] hover:bg-[var(--akdd-slate-800)] hover:text-[var(--akdd-text-inverse)] cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-2.5 py-3">
        {/* Core */}
        <div className="flex flex-col gap-1">
          {!collapsed && (
            <span className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--akdd-slate-400)]">
              Navigation
            </span>
          )}
          <NavLink to="/" end className={linkClass} title="Overview">
            <Home className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Overview</span>}
          </NavLink>

          {/* Subsystems Group */}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                if (!collapsed) setSubsystemsOpen((v) => !v)
              }}
              aria-expanded={subsystemsOpen}
              aria-controls="sidebar-subsystems"
              className={`flex items-center justify-between gap-2 rounded-[var(--akdd-radius-md)] border px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                isSubsystemRoute
                  ? 'border-[var(--akdd-sidebar-active-border)] bg-[var(--akdd-bg-sidebar-active)] text-[var(--akdd-text-inverse)]'
                  : 'border-transparent text-[var(--akdd-slate-300)] hover:bg-[var(--akdd-bg-sidebar-raised)] hover:text-[var(--akdd-text-inverse)]'
              }`}
              title="Sous-systèmes (10)"
            >
              <span className="flex items-center gap-3 min-w-0">
                <Layers className="h-4 w-4 shrink-0 stroke-[1.75]" />
                {!collapsed && <span className="truncate">Sous-systèmes (10)</span>}
              </span>
              {!collapsed &&
                (subsystemsOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--akdd-slate-400)]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--akdd-slate-400)]" />
                ))}
            </button>

            {!collapsed && subsystemsOpen && (
              <div
                id="sidebar-subsystems"
                className="ml-4 flex max-h-64 flex-col gap-0.5 overflow-y-auto border-l border-[var(--akdd-slate-800)] pl-3 pr-1"
              >
                {SUBSYSTEM_CATALOG.map((sub) => (
                  <NavLink
                    key={sub.code}
                    to={`/subsystems/${sub.code}`}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-2 rounded-[var(--akdd-radius-sm)] border px-2 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'border-[var(--akdd-sidebar-active-border)] bg-[var(--akdd-bg-sidebar-active)] text-[var(--akdd-text-inverse)]'
                          : 'border-transparent text-[var(--akdd-slate-400)] hover:bg-[var(--akdd-bg-sidebar-raised)] hover:text-[var(--akdd-text-inverse)]'
                      }`
                    }
                  >
                    <span className="truncate">
                      <span className="font-mono font-semibold">{sub.code}</span>
                      <span className="text-[var(--akdd-slate-400)]">
                        {' '}
                        · {SUBSYSTEM_SHORT_NAMES[sub.code] ?? sub.frenchName}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] opacity-80">
                      {kddCountBySubsystem[sub.code] ?? 0}
                    </span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Engines */}
        <div className="flex flex-col gap-1">
          {!collapsed && (
            <span className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--akdd-slate-400)]">
              Analyse & Graphes
            </span>
          )}
          <NavLink to="/explore" className={linkClass} title="Unit Explorer">
            <Compass className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Unit Explorer</span>}
          </NavLink>
          <NavLink to="/top-down" className={linkClass} title="Top-Down Engine">
            <GitBranch className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Top-Down Engine</span>}
          </NavLink>
          <NavLink to="/network" className={linkClass} title="Global Network">
            <Network className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Global Network</span>}
          </NavLink>
        </div>

        {/* Governance & Repositories */}
        <div className="flex flex-col gap-1">
          {!collapsed && (
            <span className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--akdd-slate-400)]">
              Référentiel & Projet
            </span>
          )}
          <NavLink to="/manager" className={linkClass} title="KDD Manager">
            <FolderKanban className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">KDD Manager</span>}
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
            title="Project Instantiation (Requirements & TRACA)"
          >
            <ClipboardCheck className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Project Instantiation</span>}
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
            title="References (Bibliothèque & Sources)"
          >
            <BookOpen className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">References & Sources</span>}
          </NavLink>
          <NavLink to="/admin" className={linkClass} title="Admin">
            <Settings className="h-4 w-4 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Admin</span>}
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-[var(--akdd-slate-800)] px-4 py-3 text-[11px] text-[var(--akdd-slate-400)]">
          <div className="flex items-center justify-between">
            <span>Phase 2 · Web App</span>
            <span className="font-mono text-[var(--akdd-slate-300)]">v2.0</span>
          </div>
        </div>
      )}
    </aside>
  )
}
