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
    `group flex items-center gap-2.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors shadow-none ${
      isActive
        ? 'border-[var(--akdd-ink)] bg-[var(--akdd-ink)] text-[var(--akdd-text-inverse)]'
        : 'border-transparent text-[var(--akdd-text-secondary)] hover:bg-[var(--akdd-slate-100)] hover:text-[var(--akdd-text-primary)]'
    }`

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col bg-[var(--akdd-bg-sidebar)] text-[var(--akdd-text-primary)] border-r border-[var(--akdd-border-subtle)] shadow-none transition-[width] duration-150 ${
        collapsed ? 'w-[68px]' : 'w-[256px]'
      }`}
    >
      {/* Brand Header — exact 56px height matching Topbar hairline */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--akdd-border-subtle)] px-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--akdd-radius-xs)] bg-[var(--akdd-ink)] font-mono text-[10px] font-bold tracking-tight text-[var(--akdd-text-inverse)]">
            AK
          </div>
          {!collapsed && (
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="font-display text-sm font-bold uppercase tracking-[-0.03em] text-[var(--akdd-text-primary)] truncate">
                AEROKDD®
              </span>
              <span className="font-mono text-[10px] text-[var(--akdd-text-muted)] truncate">
                SYS
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--akdd-radius-sm)] border border-transparent text-[var(--akdd-text-muted)] hover:border-[var(--akdd-border-subtle)] hover:bg-[var(--akdd-bg-surface)] hover:text-[var(--akdd-text-primary)] cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
        {/* Core */}
        <div className="flex flex-col gap-0.5">
          {!collapsed && (
            <span className="px-3 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--akdd-text-muted)]">
              01 / Navigation
            </span>
          )}
          <NavLink to="/" end className={linkClass} title="Overview">
            <Home className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
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
              className={`flex items-center justify-between gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors shadow-none cursor-pointer ${
                isSubsystemRoute
                  ? 'border-[var(--akdd-ink)] bg-[var(--akdd-ink)] text-[var(--akdd-text-inverse)]'
                  : 'border-transparent text-[var(--akdd-text-secondary)] hover:bg-[var(--akdd-slate-100)] hover:text-[var(--akdd-text-primary)]'
              }`}
              title="Sous-systèmes (10)"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Layers className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
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
                className="ml-4 flex flex-col border-l border-[var(--akdd-border-subtle)] py-0.5"
              >
                {SUBSYSTEM_CATALOG.map((sub) => (
                  <NavLink
                    key={sub.code}
                    to={`/subsystems/${sub.code}`}
                    className={({ isActive }) =>
                      `-ml-px flex items-center justify-between gap-2 border-l-2 pl-3 pr-2.5 py-1 text-xs transition-colors ${
                        isActive
                          ? 'border-[var(--akdd-ink)] bg-[var(--akdd-slate-100)] font-semibold text-[var(--akdd-text-primary)]'
                          : 'border-transparent text-[var(--akdd-text-secondary)] hover:border-[var(--akdd-slate-300)] hover:text-[var(--akdd-text-primary)]'
                      }`
                    }
                  >
                    <span className="truncate">
                      <span className="font-mono text-[11px] font-semibold">{sub.code}</span>
                      <span className="text-[var(--akdd-text-muted)]">
                        {' '}
                        · {SUBSYSTEM_SHORT_NAMES[sub.code] ?? sub.frenchName}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--akdd-text-muted)]">
                      {kddCountBySubsystem[sub.code] ?? 0}
                    </span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Engines */}
        <div className="flex flex-col gap-0.5 border-t border-[var(--akdd-border-subtle)] pt-3">
          {!collapsed && (
            <span className="px-3 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--akdd-text-muted)]">
              02 / Analyse & Graphes
            </span>
          )}
          <NavLink to="/explore" className={linkClass} title="Unit Explorer">
            <Compass className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Unit Explorer</span>}
          </NavLink>
          <NavLink to="/top-down" className={linkClass} title="Top-Down Engine">
            <GitBranch className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Top-Down Engine</span>}
          </NavLink>
          <NavLink to="/network" className={linkClass} title="Global Network">
            <Network className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Global Network</span>}
          </NavLink>
        </div>

        {/* Governance & Repositories */}
        <div className="flex flex-col gap-0.5 border-t border-[var(--akdd-border-subtle)] pt-3">
          {!collapsed && (
            <span className="px-3 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--akdd-text-muted)]">
              03 / Référentiel & Projet
            </span>
          )}
          <NavLink to="/manager" className={linkClass} title="KDD Manager">
            <FolderKanban className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
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
            <ClipboardCheck className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
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
            <BookOpen className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">References & Sources</span>}
          </NavLink>
          <NavLink to="/admin" className={linkClass} title="Admin">
            <Settings className="h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
            {!collapsed && <span className="truncate">Admin</span>}
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-[var(--akdd-border-subtle)] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--akdd-text-muted)]">
          <div className="flex items-center justify-between">
            <span>ECC × SHERPA</span>
            <span className="text-[var(--akdd-text-primary)]">REV 2.0</span>
          </div>
        </div>
      )}
    </aside>
  )
}
