import { ArrowRight, Compass, GitBranch, Network, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KDD } from '../../types/aerokdd'
import { StatutBadge, SubsystemBadge } from '../ui'

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  kdds: KDD[]
}

const QUICK_ROUTES = [
  { label: 'Moteur d’Analyse Top-Down', path: '/top-down', icon: GitBranch },
  { label: 'Global Network — 10 Sous-Systèmes', path: '/network', icon: Network },
  { label: 'Unit Explorer (GRAPH_KDD)', path: '/explore', icon: Compass },
]

export function CommandPalette({ open, onClose, kdds }: CommandPaletteProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const matchedKdds = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return kdds.slice(0, 12)
    return kdds
      .filter(
        (k) =>
          k.id.toLowerCase().includes(q) ||
          k.name.toLowerCase().includes(q) ||
          k.subsystemCode.toLowerCase().includes(q) ||
          k.definition.toLowerCase().includes(q),
      )
      .slice(0, 20)
  }, [kdds, query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  const openKdd = (kdd: KDD) => {
    onClose()
    navigate(`/subsystems/${kdd.subsystemCode}?kdd=${encodeURIComponent(kdd.id)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, matchedKdds.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && matchedKdds[selectedIndex]) {
      e.preventDefault()
      openKdd(matchedKdds[selectedIndex])
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[rgb(9_9_11/0.45)] pt-20 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Recherche globale KDD"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-ink)] shadow-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-[var(--akdd-border-subtle)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--akdd-text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par ID (ex. FAN-035, BOOSTER-021), nom ou définition…"
            className="flex-1 bg-transparent text-sm text-[var(--akdd-text-primary)] placeholder:text-[var(--akdd-text-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-6 w-6 items-center justify-center rounded-[var(--akdd-radius-xs)] text-[var(--akdd-text-muted)] hover:bg-[var(--akdd-slate-100)] hover:text-[var(--akdd-text-primary)] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Actions when query is empty */}
        {!query.trim() && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] px-4 py-2.5">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--akdd-text-muted)]">
              Accès rapide :
            </span>
            {QUICK_ROUTES.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate(item.path)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--akdd-bg-surface)] px-3 py-1 text-xs font-medium text-[var(--akdd-text-primary)] border border-[var(--akdd-border-subtle)] hover:border-[var(--akdd-ink)] cursor-pointer"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Results */}
        <div className="flex max-h-[380px] flex-col overflow-y-auto divide-y divide-[var(--akdd-border-subtle)]">
          {matchedKdds.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[var(--akdd-text-muted)]">
              Aucun KDD trouvé pour « {query} ».
            </div>
          ) : (
            matchedKdds.map((kdd, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={kdd.id}
                  type="button"
                  onClick={() => openKdd(kdd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-[var(--akdd-accent-blue-soft)]' : 'hover:bg-[var(--akdd-slate-50)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SubsystemBadge code={kdd.subsystemCode} />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--akdd-navy-900)]">
                          {kdd.id}
                        </span>
                        <span className="text-sm font-medium text-[var(--akdd-text-primary)] truncate">
                          {kdd.name}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--akdd-text-muted)] truncate">
                        {kdd.definition}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatutBadge statut={kdd.statutKdd} />
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--akdd-text-muted)]" />
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="flex items-center justify-between border-t border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-subtle)] px-4 py-2 font-mono text-[10.5px] text-[var(--akdd-text-muted)]">
          <span>↑↓ Naviguer · ↵ Ouvrir la fiche · Esc Fermer</span>
          <span className="font-mono">{matchedKdds.length} résultat(s)</span>
        </div>
      </div>
    </div>
  )
}
