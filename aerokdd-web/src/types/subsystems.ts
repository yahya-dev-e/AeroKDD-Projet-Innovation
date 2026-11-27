import type { SubsystemCode } from './aerokdd'

export interface SubsystemMeta {
  code: SubsystemCode
  frenchName: string
  shortRole: string
  tokenVar: string
  imagePath: string
}

export const SUBSYSTEM_CATALOG: readonly SubsystemMeta[] = [
  {
    code: 'FAN',
    frenchName: 'Soufflante',
    shortRole: 'Flux secondaire, poussée principale & acoustique',
    tokenVar: '--akdd-sys-fan',
    imagePath: '/assets/FAN.png',
  },
  {
    code: 'BOOSTER',
    frenchName: 'Compresseur BP (LPC)',
    shortRole: 'Pré-compression du flux primaire',
    tokenVar: '--akdd-sys-booster',
    imagePath: '/assets/Low-pressure compressor.png',
  },
  {
    code: 'HPC',
    frenchName: 'Compresseur HP',
    shortRole: 'Compression haute pression & marge au pompage',
    tokenVar: '--akdd-sys-hpc',
    imagePath: '/assets/High-pressure compressor.png',
  },
  {
    code: 'COMB',
    frenchName: 'Chambre de combustion',
    shortRole: 'Apport d’énergie thermique, stabilité & émissions',
    tokenVar: '--akdd-sys-comb',
    imagePath: '/assets/Combustor.png',
  },
  {
    code: 'HPT',
    frenchName: 'Turbine HP',
    shortRole: 'Entraînement corps HP & tenue thermomécanique',
    tokenVar: '--akdd-sys-hpt',
    imagePath: '/assets/High-pressure turbine.png',
  },
  {
    code: 'LPT',
    frenchName: 'Turbine BP',
    shortRole: 'Entraînement soufflante / booster',
    tokenVar: '--akdd-sys-lpt',
    imagePath: '/assets/Low-pressure turbine.png',
  },
  {
    code: 'NOZZLE',
    frenchName: 'Tuyère d’éjection',
    shortRole: 'Détente finale, poussée nette & bruit de jet',
    tokenVar: '--akdd-sys-nozzle',
    imagePath: '/assets/nuzzle.png',
  },
  {
    code: 'COOLING',
    frenchName: 'Système de refroidissement',
    shortRole: 'Prélèvements d’air & protection thermique',
    tokenVar: '--akdd-sys-cooling',
    imagePath: '/assets/Syst\u00e8me de refroidissement.png',
  },
  {
    code: 'ELECTRICAL',
    frenchName: 'Système électrique',
    shortRole: 'Génération, distribution, FADEC & démarrage',
    tokenVar: '--akdd-sys-electrical',
    imagePath: '/assets/Systeme \u00e9lectrique.png',
  },
  {
    code: 'OIL',
    frenchName: 'Système d’huile (Lube)',
    shortRole: 'Lubrification, refroidissement paliers & réducteur',
    tokenVar: '--akdd-sys-oil',
    imagePath: "/assets/syst\u00e9me d'huile.png",
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
      imagePath: '/assets/FAN.png',
    }
  )
}
