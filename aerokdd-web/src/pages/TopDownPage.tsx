import { GitBranch, Layers, Search, Table2, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopDownStackedChart, TopDownTreeFlow } from '../components/graphs'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CentralityBadge,
  KpiCard,
  SubsystemBadge,
  Tabs,
} from '../components/ui'
import { runTopDownAnalysis, TOP_DOWN_THEMES, type TopDownTheme } from '../engines/topDownEngine'
import { useAeroKddStore } from '../store/useAeroKddStore'

type TopDownView = 'TABLE' | 'VISUAL'
type LevelFilter = 'ALL' | 'N1' | 'N2'

const DISPLAY_THEME_LABELS: Record<string, string> = {
  'TOUTES LES PRESTATIONS': 'TOUTES LES PRESTATIONS',
  'Bruit / Acoustique': 'Bruit / Acoustique',
  'Poussee / Debit': 'Poussée / Débit',
  'Rendement / Consommation': 'Rendement / Consommation',
  'Masse / Encombrement': 'Masse / Encombrement',
  'Emissions (NOx / CO)': 'Émissions (NOx / CO)',
  'Stabilite / Pompage': 'Stabilité / Pompage',
  'Thermique / Duree de vie': 'Thermique / Durée de vie',
  'Securite / Chocs / Burst': 'Sécurité / Chocs / Burst',
  'Cout / Maintenance': 'Coût / Maintenance',
}

export function TopDownPage() {
  const navigate = useNavigate()
  const { kdds, relations } = useAeroKddStore()

  const [selectedTheme, setSelectedTheme] = useState<TopDownTheme>('Bruit / Acoustique')
  const [viewMode, setViewMode] = useState<TopDownView>('TABLE')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const analysis = useMemo(
    () => runTopDownAnalysis(kdds, relations, selectedTheme),
    [kdds, relations, selectedTheme],
  )

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return analysis.rows.filter((row) => {
      if (levelFilter === 'N1' && row.level !== 1) return false
      if (levelFilter === 'N2' && row.level !== 2) return false
      if (!q) return true
      return (
        row.prestationLabel.toLowerCase().includes(q) ||
        row.leverId.toLowerCase().includes(q) ||
        row.leverName.toLowerCase().includes(q) ||
        row.leverSubsystem.toLowerCase().includes(q) ||
        row.sideEffectsText.toLowerCase().includes(q) ||
        row.justification.toLowerCase().includes(q)
      )
    })
  }, [analysis.rows, levelFilter, searchQuery])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      {/* Control Header */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--akdd-text-muted)]">
              Moteur d’Analyse Top-Down (mod_AnalyseTopDown)
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="topdown-theme-select"
                className="text-sm font-semibold text-[var(--akdd-navy-900)]"
              >
                Objectif / Prestation Cible :
              </label>
              <select
                id="topdown-theme-select"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value as TopDownTheme)}
                className="rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-navy-600)] bg-[var(--akdd-accent-blue-soft)] px-3.5 py-1.5 text-sm font-semibold text-[var(--akdd-navy-900)] focus:outline-none"
              >
                {TOP_DOWN_THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {DISPLAY_THEME_LABELS[theme] ?? theme}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Tabs<TopDownView>
            activeTab={viewMode}
            onChange={setViewMode}
            tabs={[
              {
                id: 'TABLE',
                label: 'Vue Tableau (TOP DOWN)',
                badge: analysis.rows.length,
                icon: <Table2 className="h-4 w-4" />,
              },
              {
                id: 'VISUAL',
                label: 'Visualisation TOP DOWN',
                icon: <GitBranch className="h-4 w-4" />,
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Live Metrics Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Prestations Ciblées"
          value={analysis.matchedPrestationsCount}
          subtitle={`${analysis.totalRelationsAnalyzed} relations analysées`}
          icon={<Target className="h-5 w-5" />}
          accentClassName="border-l-[var(--akdd-navy-700)]"
        />
        <KpiCard
          label="Leviers Directs (Niv. 1)"
          value={analysis.directCount}
          subtitle="Impact direct Levier → Prestation"
          accentClassName="border-l-[var(--akdd-edge-topdown)]"
        />
        <KpiCard
          label="Leviers Indirects (Niv. 2)"
          value={analysis.indirectCount}
          subtitle="Chaînes Levier → Relais → Prestation"
          accentClassName="border-l-[var(--akdd-edge-coupling)]"
        />
        <KpiCard
          label="Sous-Systèmes Impactés"
          value={analysis.touchedSubsystemsCount}
          subtitle="Couverture inter-modules"
          icon={<Layers className="h-5 w-5" />}
          accentClassName="border-l-[var(--akdd-accent-blue)]"
        />
      </section>

      {/* ===================== VIEW 1: TABLE ===================== */}
      {viewMode === 'TABLE' && (
        <Card>
          <CardHeader
            title={`Résultats Top-Down — ${DISPLAY_THEME_LABELS[selectedTheme] ?? selectedTheme}`}
            subtitle="Trié par Niveau (N1 puis N2 Inter-Sys), Centralité décroissante (Carrefour ≥ 8, Fort 4–7, Cible 1–3) et Prestation"
            action={
              <div className="flex flex-wrap items-center gap-2">
                {(['ALL', 'N1', 'N2'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelFilter(lvl)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border cursor-pointer ${
                      levelFilter === lvl
                        ? 'bg-[var(--akdd-navy-700)] text-[var(--akdd-text-inverse)] border-[var(--akdd-navy-700)]'
                        : 'bg-[var(--akdd-bg-canvas)] text-[var(--akdd-text-secondary)] border-[var(--akdd-border-subtle)]'
                    }`}
                  >
                    {lvl === 'ALL'
                      ? `Tous (${analysis.rows.length})`
                      : lvl === 'N1'
                        ? `Directs N1 (${analysis.directCount})`
                        : `Indirects N2 (${analysis.indirectCount})`}
                  </button>
                ))}
              </div>
            }
          />
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-[var(--akdd-radius-sm)] border border-[var(--akdd-border-default)] bg-[var(--akdd-bg-canvas)] px-3 py-1.5 max-w-md">
              <Search className="h-3.5 w-3.5 text-[var(--akdd-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer par levier, prestation, effet de bord…"
                className="flex-1 bg-transparent text-xs text-[var(--akdd-text-primary)] placeholder:text-[var(--akdd-text-muted)] focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto rounded-[var(--akdd-radius-md)] border border-[var(--akdd-border-subtle)]">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-navy-600)] text-[11px] font-semibold text-[var(--akdd-text-inverse)]">
                    <th className="px-3 py-2.5 min-w-[175px]">Prestation Cible</th>
                    <th className="px-3 py-2.5 w-[100px]">Sous-Sys.</th>
                    <th className="px-3 py-2.5 w-[110px]">ID Levier</th>
                    <th className="px-3 py-2.5 min-w-[170px]">Nom KDD Physique</th>
                    <th className="px-3 py-2.5 min-w-[165px]">Relation & Direction</th>
                    <th className="px-3 py-2.5 w-[145px]">Criticité / Centralité</th>
                    <th className="px-3 py-2.5 min-w-[230px]">Effets de bord réels</th>
                    <th className="px-3 py-2.5 min-w-[230px]">Justification Physique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--akdd-border-subtle)]">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-[var(--akdd-text-muted)]"
                      >
                        Aucun levier trouvé pour cette sélection.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr
                        key={`${row.prestationId}-${row.leverId}-${idx}`}
                        className="align-top hover:bg-[var(--akdd-slate-50)]"
                      >
                        <td className="px-3 py-2.5 font-medium text-[var(--akdd-text-primary)]">
                          {row.prestationLabel}
                        </td>
                        <td className="px-3 py-2.5">
                          <SubsystemBadge code={row.leverSubsystem} />
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => navigate(`/explore/${encodeURIComponent(row.leverId)}`)}
                            className="font-mono font-bold text-[var(--akdd-accent-blue)] hover:underline cursor-pointer"
                          >
                            {row.leverId}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-[var(--akdd-text-primary)]">
                          {row.leverName}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={
                                row.level === 1
                                  ? 'w-fit bg-[var(--akdd-edge-topdown-bg)] text-[var(--akdd-edge-topdown-text)] border-[var(--akdd-edge-topdown)]'
                                  : row.isInterSystem
                                    ? 'w-fit bg-[var(--akdd-edge-coupling-bg)] text-[var(--akdd-edge-coupling-text)] border-[var(--akdd-edge-coupling)]'
                                    : 'w-fit bg-[var(--akdd-slate-100)] text-[var(--akdd-slate-700)] border-[var(--akdd-border-default)]'
                              }
                            >
                              {row.level === 1
                                ? 'DIRECT (N1)'
                                : row.isInterSystem
                                  ? 'INDIRECT INTER-SYS (N2)'
                                  : 'INDIRECT (N2)'}
                            </Badge>
                            <span className="whitespace-pre-line text-[11px] text-[var(--akdd-text-secondary)]">
                              {row.directionText}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <CentralityBadge level={row.badge.level} label={row.badge.label} />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex max-h-28 flex-col gap-0.5 overflow-y-auto text-[11px] text-[var(--akdd-text-secondary)]">
                            {row.sideEffects.length === 0 ? (
                              <span className="italic text-[var(--akdd-text-muted)]">
                                Aucun effet de bord enregistré.
                              </span>
                            ) : (
                              row.sideEffects.map((se, i) => (
                                <span key={se.kddId}>
                                  <strong className="font-mono text-[var(--akdd-navy-800)]">
                                    {i + 1}) {se.kddId}
                                  </strong>{' '}
                                  — {se.kddName}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-pre-line text-[11px] leading-relaxed text-[var(--akdd-text-secondary)]">
                          {row.justification || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================== VIEW 2: VISUAL TREE ===================== */}
      {viewMode === 'VISUAL' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left 2 cols: 3-tier React Flow Tree */}
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader
              title="Organigramme Top-Down (Objectif → Sous-Systèmes → Top Leviers)"
              subtitle="Trait plein = Direct [N1] · Pointillé = Indirect [N2] · Cliquer un levier pour l’explorer"
            />
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-canvas)] px-4 py-2 text-xs">
              <CentralityBadge level="CARREFOUR" label="CARREFOUR (≥ 8 liens)" />
              <CentralityBadge level="FORT" label="FORT (4–7 liens)" />
              <CentralityBadge level="CIBLE" label="CIBLE (1–3 liens)" />
            </div>
            <div className="bg-[#fbfdff]">
              <TopDownTreeFlow
                analysis={analysis}
                onSelectLever={(id) => navigate(`/explore/${encodeURIComponent(id)}`)}
              />
            </div>
          </Card>

          {/* Right col: Synthèse par Sous-Système + Stacked Bar Chart */}
          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader
                title="Leviers par Sous-Système"
                subtitle="Comparaison Direct (Niv 1) vs Indirect (Niv 2)"
              />
              <CardContent>
                <TopDownStackedChart data={analysis.subsystemSummary} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Synthèse par Sous-Système" />
              <CardContent className="p-0">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--akdd-border-subtle)] bg-[var(--akdd-bg-canvas)] text-[11px] font-semibold uppercase text-[var(--akdd-text-muted)]">
                      <th className="px-4 py-2">Sous-Système</th>
                      <th className="px-4 py-2 text-center">Direct (N1)</th>
                      <th className="px-4 py-2 text-center">Indirect (N2)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--akdd-border-subtle)]">
                    {analysis.subsystemSummary.map((item) => (
                      <tr key={item.subsystem}>
                        <td className="px-4 py-2 font-semibold text-[var(--akdd-navy-900)]">
                          {item.subsystem}
                        </td>
                        <td className="px-4 py-2 text-center font-mono font-bold text-[var(--akdd-navy-900)]">
                          {item.directCount}
                        </td>
                        <td className="px-4 py-2 text-center font-mono text-[var(--akdd-text-secondary)]">
                          {item.indirectCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
