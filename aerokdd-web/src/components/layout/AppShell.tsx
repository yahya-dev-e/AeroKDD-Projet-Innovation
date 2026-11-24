import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAeroKddStore } from '../../store/useAeroKddStore'
import { Button } from '../ui'
import { CommandPalette } from './CommandPalette'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const { kdds, relations, isLoaded, isLoading, error, initialize } = useAeroKddStore()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const isNetwork = location.pathname.startsWith('/network')

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const kddCountBySubsystem = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const k of kdds) {
      counts[k.subsystemCode] = (counts[k.subsystemCode] ?? 0) + 1
    }
    return counts
  }, [kdds])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--akdd-bg-canvas)] text-[var(--akdd-text-primary)]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        kddCountBySubsystem={kddCountBySubsystem}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar
          kddCount={kdds.length}
          relationCount={relations.length}
          onOpenCommandPalette={() => setPaletteOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />

        <main
          className={`flex-1 bg-[var(--akdd-bg-canvas)] ${
            isNetwork
              ? 'overflow-hidden p-0'
              : 'overflow-y-auto px-5 py-4 lg:px-6 lg:py-5'
          }`}
        >
          {error ? (
            <div className="mx-auto my-12 flex max-w-lg flex-col items-center gap-3 rounded-[var(--akdd-radius-lg)] border border-[var(--akdd-status-contrainte-border)] bg-[var(--akdd-status-contrainte-bg)] p-6 text-center shadow-none">
              <p className="text-sm font-medium text-[var(--akdd-status-contrainte-text)]">
                Impossible de charger le référentiel AeroKDD
              </p>
              <p className="text-xs text-[var(--akdd-status-contrainte-text)]">{error}</p>
              <Button variant="primary" size="sm" onClick={() => void initialize(true)}>
                Réessayer
              </Button>
            </div>
          ) : !isLoaded && isLoading ? (
            <div className="flex h-64 items-center justify-center font-mono text-xs uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
              Chargement du référentiel AeroKDD (566 KDDs · 1,267 LIENS)…
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} kdds={kdds} />
    </div>
  )
}
