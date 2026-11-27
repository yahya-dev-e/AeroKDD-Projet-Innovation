import { useState } from 'react'
import { getSubsystemMeta } from '../../types/subsystems'

export interface SubsystemCadThumbnailProps {
  code: string
  className?: string
  imgClassName?: string
}

function CadSvgFallback({ code }: { code: string }) {
  const upper = code.toUpperCase()

  switch (upper) {
    case 'FAN':
      return (
        <svg viewBox="0 0 96 64" className="h-14 w-24" fill="none" aria-hidden="true">
          <ellipse cx="48" cy="32" rx="25" ry="25" fill="#E2E8F0" stroke="#475569" strokeWidth="1.4" />
          <ellipse cx="48" cy="32" rx="21" ry="21" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.1" />
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16
            return (
              <line
                key={angle}
                x1="48"
                y1="32"
                x2="48"
                y2="12"
                stroke="#334155"
                strokeWidth="1.6"
                strokeLinecap="round"
                transform={`rotate(${angle} 48 32)`}
              />
            )
          })}
          <circle cx="48" cy="32" r="6.5" fill="#CBD5E1" stroke="#1E293B" strokeWidth="1.3" />
          <circle cx="48" cy="32" r="2.2" fill="#0F1D32" />
        </svg>
      )

    case 'BOOSTER':
      return (
        <svg viewBox="0 0 96 64" className="h-14 w-24" fill="none" aria-hidden="true">
          <path d="M20 18L72 22V42L20 46V18Z" fill="#E2E8F0" stroke="#475569" strokeWidth="1.3" />
          {[26, 35, 44, 53, 62].map((x, idx) => (
            <g key={x}>
              <rect
                x={x}
                y={17 + idx * 0.7}
                width="4.5"
                height={30 - idx * 1.4}
                rx="1"
                fill="#CBD5E1"
                stroke="#334155"
                strokeWidth="1.1"
              />
            </g>
          ))}
          <ellipse cx="20" cy="32" rx="5.5" ry="14" fill="#F1F5F9" stroke="#334155" strokeWidth="1.3" />
          <ellipse cx="72" cy="32" rx="4.5" ry="10" fill="#CBD5E1" stroke="#334155" strokeWidth="1.2" />
          <line x1="12" y1="32" x2="82" y2="32" stroke="#0F1D32" strokeWidth="1.2" strokeDasharray="3 2" />
        </svg>
      )

    case 'HPC':
      return (
        <svg viewBox="0 0 96 64" className="h-14 w-24" fill="none" aria-hidden="true">
          <path d="M16 17L78 23V41L16 47V17Z" fill="#E2E8F0" stroke="#475569" strokeWidth="1.3" />
          {[21, 28, 35, 42, 49, 56, 63, 70].map((x, idx) => (
            <rect
              key={x}
              x={x}
              y={17.5 + idx * 0.65}
              width="3.6"
              height={29 - idx * 1.3}
              rx="0.8"
              fill={idx % 2 === 0 ? '#CBD5E1' : '#94A3B8'}
              stroke="#334155"
              strokeWidth="1"
            />
          ))}
          <ellipse cx="16" cy="32" rx="4.5" ry="15" fill="#F8FAFC" stroke="#1E293B" strokeWidth="1.3" />
          <ellipse cx="78" cy="32" rx="3.5" ry="9" fill="#CBD5E1" stroke="#1E293B" strokeWidth="1.2" />
        </svg>
      )

    case 'COMB':
      return (
        <svg viewBox="0 0 96 64" className="h-14 w-24" fill="none" aria-hidden="true">
          <path
            d="M22 24C22 18 35 15 49 15C64 15 76 19 76 25V39C76 45 64 49 49 49C35 49 22 46 22 40V24Z"
            fill="#E2E8F0"
            stroke="#334155"
            strokeWidth="1.3"
          />
          <ellipse cx="49" cy="32" rx="19" ry="9" fill="#F8FAFC" stroke="#475569" strokeWidth="1.1" />
          {[35, 44, 53, 62].map((x) => (
            <circle key={x} cx={x} cy="22" r="2" fill="#64748B" />
          ))}
          {[35, 44, 53, 62].map((x) => (
            <circle key={x} cx={x} cy="42" r="2" fill="#64748B" />
          ))}
          <path d="M14 29H24M14 35H24" stroke="#0F1D32" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    case 'HPT':
      return (
        <svg viewBox="0 0 96 64" className="h-14 w-24" fill="none" aria-hidden="true">
          <ellipse cx="38" cy="32" rx="14" ry="21" fill="#CBD5E1" stroke="#1E293B" strokeWidth="1.3" />
          <ellipse cx="56" cy="32" rx="14" ry="23" fill="#E2E8F0" stroke="#334155" strokeWidth="1.3" />
          {Array.from({ length: 11 }).map((_, i) => {
            const y = 13 + i * 3.8
            return <line key={y} x1="44" y1={y} x2="66" y2={y} stroke="#475569" strokeWidth="1.2" />
          })}
          <ellipse cx="56" cy="32" rx="6" ry="9" fill="#F8FAFC" stroke="#1E293B" strokeWidth="1.2" />
          <line x1="18" y1="32" x2="76" y2="32" stroke="#0F1D32" strokeWidth="1.4" />
        </svg>
      )

    case 'LPT':
      return (
        <svg viewBox="0 0 96 64" className="h-14 w-24" fill="none" aria-hidden="true">
          {[26, 36, 47, 59].map((x, idx) => (
            <ellipse
              key={x}
              cx={x}
              cy="32"
              rx={4.5}
              ry={13 + idx * 3}
              fill={idx % 2 === 0 ? '#E2E8F0' : '#CBD5E1'}
              stroke="#334155"
              strokeWidth="1.2"
            />
          ))}
          <rect x="16" y="29.5" width="56" height="5" rx="1.5" fill="#94A3B8" stroke="#1E293B" strokeWidth="1.1" />
        </svg>
      )

    case 'NOZZLE':
      return (
        <svg viewBox="0 0 96 64" className="h-14 w-24" fill="none" aria-hidden="true">
          <path
            d="M20 14L62 20L76 25V39L62 44L20 50V14Z"
            fill="#E2E8F0"
            stroke="#334155"
            strokeWidth="1.3"
          />
          <ellipse cx="20" cy="32" rx="5.5" ry="18" fill="#CBD5E1" stroke="#1E293B" strokeWidth="1.3" />
          <path d="M62 20V44" stroke="#64748B" strokeWidth="1.1" strokeDasharray="2 2" />
          <path d="M32 23L58 26M32 41L58 38" stroke="#64748B" strokeWidth="1" />
        </svg>
      )

    case 'COOLING':
      return (
        <svg viewBox="0 0 96 64" className="h-14 w-24" fill="none" aria-hidden="true">
          <path
            d="M22 26C22 19 36 16 54 17C68 18 75 23 75 30C75 38 64 45 45 46C29 47 22 41 22 33V26Z"
            fill="#E2E8F0"
            stroke="#334155"
            strokeWidth="1.3"
          />
          {[32, 40, 48, 56, 64].map((x) =>
            [24, 30, 36].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#334155" />
            )),
          )}
          <path d="M27 40C38 42 54 40 68 34" stroke="#2B5B84" strokeWidth="1.2" strokeDasharray="2 2" />
        </svg>
      )

    case 'ELECTRICAL':
      return (
        <svg viewBox="0 0 96 64" className="h-14 w-24" fill="none" aria-hidden="true">
          <rect x="42" y="16" width="32" height="30" rx="3" fill="#E2E8F0" stroke="#334155" strokeWidth="1.3" />
          <rect x="47" y="21" width="22" height="12" rx="1.5" fill="#F8FAFC" stroke="#64748B" strokeWidth="1" />
          <circle cx="52" cy="39" r="2" fill="#334155" />
          <circle cx="60" cy="39" r="2" fill="#334155" />
          <path
            d="M18 24C27 24 31 24 42 24M16 32C26 32 31 31 42 31M20 40C29 40 33 38 42 38"
            stroke="#475569"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      )

    default:
      // OIL / Lube gear pump assembly
      return (
        <svg viewBox="0 0 96 64" className="h-14 w-24" fill="none" aria-hidden="true">
          <rect x="24" y="17" width="46" height="30" rx="5" fill="#E2E8F0" stroke="#334155" strokeWidth="1.3" />
          <circle cx="39" cy="32" r="8.5" fill="#F8FAFC" stroke="#334155" strokeWidth="1.3" />
          <circle cx="56" cy="32" r="8.5" fill="#CBD5E1" stroke="#334155" strokeWidth="1.3" />
          <circle cx="39" cy="32" r="2.5" fill="#0F1D32" />
          <circle cx="56" cy="32" r="2.5" fill="#0F1D32" />
          <rect x="16" y="28" width="8" height="8" rx="1" fill="#CBD5E1" stroke="#334155" strokeWidth="1.1" />
          <rect x="70" y="28" width="8" height="8" rx="1" fill="#CBD5E1" stroke="#334155" strokeWidth="1.1" />
        </svg>
      )
  }
}

export function SubsystemCadThumbnail({
  code,
  className = '',
  imgClassName = '',
}: SubsystemCadThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const meta = getSubsystemMeta(code)
  const assetUrl = encodeURI(meta.imagePath)
  const imgFailed = failedSrc === assetUrl

  return (
    <div className={`flex h-24 w-full items-center justify-center overflow-hidden ${className}`}>
      {!imgFailed ? (
        <img
          key={assetUrl}
          src={assetUrl}
          alt={`${meta.code} — ${meta.frenchName}`}
          loading="lazy"
          onError={() => setFailedSrc(assetUrl)}
          className={`h-full w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-[1.04] ${imgClassName}`}
        />
      ) : (
        <CadSvgFallback code={code} />
      )}
    </div>
  )
}
