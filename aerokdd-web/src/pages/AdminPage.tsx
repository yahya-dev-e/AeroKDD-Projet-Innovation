import {
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button, Card, CardContent, CardHeader, KpiCard } from '../components/ui'
import type { ClassificationCounts } from '../engines/classifier'
import type { ValidationBatchCounts } from '../engines/validator'
import { useAeroKddStore } from '../store/useAeroKddStore'

export function AdminPage() {
  const {
    kdds,
    relations,
    bibliotheque,
    sources,
    requirements,
    tracaEntries,
    reclassifyAllKdds,
    revalidateAllRelations,
    resetToSeed,
  } = useAeroKddStore()

  const [classResult, setClassResult] = useState<ClassificationCounts | null>(null)
  const [valResult, setValResult] = useState<ValidationBatchCounts | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleRunClassifier = async () => {
    const counts = await reclassifyAllKdds()
    setClassResult(counts)
    setStatusMessage(
      `Classification SPEC terminée sur ${counts.total} KDDs (${counts.kdd} KDD, ${counts.sizing} S, ${counts.design} D).`,
    )
  }

  const handleRunValidator = async () => {
    const batch = await revalidateAllRelations()
    setValResult(batch.counts)
    setStatusMessage(
      `Validation terminée sur ${batch.counts.total} relations (${batch.counts.validated} Validé, ${batch.counts.review} À vérifier, ${batch.counts.candidate} Candidat).`,
    )
  }

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kdds), 'DATA-KDDs')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(relations), 'KDD - Relations')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bibliotheque), 'BIBLIOTHEQUE')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sources), 'SOURCES_REL')
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(requirements.length > 0 ? requirements : [{}]),
      'Requirements',
    )
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(tracaEntries.length > 0 ? tracaEntries : [{}]),
      'TRACA',
    )

    const stamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `AeroKDD_Export_${stamp}.xlsx`)
    setStatusMessage(`Export Excel généré : AeroKDD_Export_${stamp}.xlsx`)
  }

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      kdds,
      relations,
      bibliotheque,
      sources,
      requirements,
      tracaEntries,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `aerokdd-dataset-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatusMessage(`Export JSON généré : aerokdd-dataset-${stamp}.json`)
  }

  const handleResetSeed = async () => {
    await resetToSeed()
    setClassResult(null)
    setValResult(null)
    setStatusMessage('Base locale réinitialisée depuis les fichiers seed /data/*.json.')
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7">
      <div className="flex flex-col gap-1 rounded-[var(--akdd-radius-lg)] bg-[var(--akdd-bg-surface)] border border-[var(--akdd-border-subtle)] p-6 shadow-none">
        <h1 className="font-display text-2xl font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--akdd-text-primary)]">
          Administration & Outils de Maintenance
        </h1>
        <p className="text-xs text-[var(--akdd-text-secondary)]">
          Exécutez les utilitaires de maintenance en masse portés de VBA (mod_Admin_FiltreSPEC &
          mod_Admin_TriRelations) et exportez le référentiel en .xlsx ou .json.
        </p>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-[var(--akdd-radius-md)] border border-[var(--akdd-status-kdd-border)] bg-[var(--akdd-status-kdd-bg)] px-4 py-3 text-sm text-[var(--akdd-status-kdd-text)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Maintenance Engines */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card>
          <CardHeader
            title="SPEC Classifier (mod_Admin_FiltreSPEC)"
            subtitle="Recalcule la colonne Statut KDD (Filtre) sur l’ensemble des 566+ éléments"
          />
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-[var(--akdd-text-secondary)]">
              Applique l’ordre exact des règles métier (FAN Pressure Ratio FPR, Robustness Strategy,
              Thermal Growth & Creep, Safety/HED/Burst, Solution K/S/D, Prestation, Effet Induit,
              Input, Contrainte).
            </p>
            <Button
              variant="primary"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void handleRunClassifier()}
            >
              Re-run SPEC Classifier
            </Button>

            {classResult && (
              <div className="grid grid-cols-2 gap-2 rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-canvas)] p-3 text-xs border border-[var(--akdd-border-subtle)] font-mono">
                <span>KDD : <strong>{classResult.kdd}</strong></span>
                <span>S - Sizing : <strong>{classResult.sizing}</strong></span>
                <span>D - Design : <strong>{classResult.design}</strong></span>
                <span>Prestations : <strong>{classResult.prestation}</strong></span>
                <span>Effets Induits : <strong>{classResult.effetInduit}</strong></span>
                <span>Inputs : <strong>{classResult.input}</strong></span>
                <span>Contraintes : <strong>{classResult.contrainte}</strong></span>
                <span>Total : <strong>{classResult.total}</strong></span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Relation Validator (mod_Admin_TriRelations)"
            subtitle="Reclasse Validé / À vérifier / Candidat tout en préservant Rejeté"
          />
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-[var(--akdd-text-secondary)]">
              Vérifie la complétude (Justification &gt; 10 car., Équation &gt; 2 car., Référence
              &gt; 2 car.), détecte les auto-relations, paires inverses et doublons dirigés.
            </p>
            <Button
              variant="primary"
              icon={<ShieldCheck className="h-4 w-4" />}
              onClick={() => void handleRunValidator()}
            >
              Re-run Relation Validator
            </Button>

            {valResult && (
              <div className="grid grid-cols-2 gap-2 rounded-[var(--akdd-radius-md)] bg-[var(--akdd-bg-canvas)] p-3 text-xs border border-[var(--akdd-border-subtle)] font-mono">
                <span>Validé : <strong>{valResult.validated}</strong></span>
                <span>À vérifier : <strong>{valResult.review}</strong></span>
                <span>Candidat : <strong>{valResult.candidate}</strong></span>
                <span>Rejeté : <strong>{valResult.rejected}</strong></span>
                <span>Auto-relations : <strong>{valResult.autoRelations}</strong></span>
                <span>Paires inverses : <strong>{valResult.inversePairs}</strong></span>
                <span>Doublons : <strong>{valResult.exactDuplicates}</strong></span>
                <span>Total : <strong>{valResult.total}</strong></span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exports & Reset */}
      <Card>
        <CardHeader
          title="Export du Référentiel & Persistance Locale"
          subtitle="Export multi-onglets Excel (.xlsx via SheetJS) ou snapshot JSON complet"
        />
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="DATA-KDDs" value={kdds.length} />
            <KpiCard label="Relations" value={relations.length} />
            <KpiCard label="Requirements" value={requirements.length} />
            <KpiCard label="TRACA" value={tracaEntries.length} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={handleExportExcel}
            >
              Exporter Excel (.xlsx)
            </Button>
            <Button
              variant="secondary"
              icon={<FileJson className="h-4 w-4" />}
              onClick={handleExportJson}
            >
              Exporter Snapshot (.json)
            </Button>
            <Button
              variant="danger"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => void handleResetSeed()}
            >
              Réinitialiser depuis Seed (/data/*.json)
            </Button>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-[var(--akdd-text-muted)]">
            <Download className="h-3.5 w-3.5" />
            L’export Excel inclut les 6 onglets : DATA-KDDs, KDD - Relations, BIBLIOTHEQUE,
            SOURCES_REL, Requirements et TRACA.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
