import type { SubsystemCode } from './aerokdd'

export interface SubsystemMeta {
  code: SubsystemCode
  frenchName: string
  shortRole: string
  tokenVar: string
}

export const SUBSYSTEM_CATALOG: readonly SubsystemMeta[] = [
  {
    code: 'FAN',
    frenchName: 'Soufflante',
    shortRole: 'Flux secondaire, poussée principale & acoustique',
    tokenVar: '--akdd-sys-fan',
  },
  {
    code: 'BOOSTER',
    frenchName: 'Compresseur BP (LPC)',
    shortRole: 'Pré-compression du flux primaire',
    tokenVar: '--akdd-sys-booster',
  },
  {
    code: 'HPC',
    frenchName: 'Compresseur HP',
    shortRole: 'Compression haute pression & marge au pompage',
    tokenVar: '--akdd-sys-hpc',
  },
  {
    code: 'COMB',
    frenchName: 'Chambre de combustion',
    shortRole: 'Apport d’énergie thermique, stabilité & émissions',
    tokenVar: '--akdd-sys-comb',
  },
  {
    code: 'HPT',
    frenchName: 'Turbine HP',
    shortRole: 'Entraînement corps HP & tenue thermomécanique',
    tokenVar: '--akdd-sys-hpt',
  },
  {
    code: 'LPT',
    frenchName: 'Turbine BP',
    shortRole: 'Entraînement soufflante / booster',
    tokenVar: '--akdd-sys-lpt',
  },
  {
    code: 'NOZZLE',
    frenchName: 'Tuyère d’éjection',
    shortRole: 'Détente finale, poussée nette & bruit de jet',
    tokenVar: '--akdd-sys-nozzle',
  },
  {
    code: 'COOLING',
    frenchName: 'Système de refroidissement',
    shortRole: 'Prélèvements d’air & protection thermique',
    tokenVar: '--akdd-sys-cooling',
  },
  {
    code: 'ELECTRICAL',
    frenchName: 'Système électrique',
    shortRole: 'Génération, distribution, FADEC & démarrage',
    tokenVar: '--akdd-sys-electrical',
  },
  {
    code: 'OIL',
    frenchName: 'Système d’huile (Lube)',
    shortRole: 'Lubrification, refroidissement paliers & réducteur',
    tokenVar: '--akdd-sys-oil',
  },
] as const

export function getSubsystemMeta(code: string): SubsystemMeta {
  const upper = (code || '').trim().toUpperCase()
  return (
    SUBSYSTEM_CATALOG.find((s) => s.code === upper) ?? {
      code: 'FAN',
      frenchName: code,
      shortRole: 'Sous-système propulsif',
      tokenVar: '--akdd-sys-fan',
    }
  )
}
