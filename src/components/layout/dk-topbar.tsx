'use client'

import { GameIcon } from '@/components/ui/game-icon'

interface DKTopbarProps {
  crumbs: string[]
  right?: React.ReactNode
  liveLabel?: string
}

export function DKTopbar({ crumbs, right, liveLabel = 'JORNADA 4 · 2 EN VIVO' }: DKTopbarProps) {
  return (
    <div className="dk-topbar">
      <div className="dk-crumbs">
        {crumbs.map((c, i, arr) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className={i === arr.length - 1 ? 'crumb-now' : 'crumb'}>{c}</span>
            {i < arr.length - 1 && <span className="arrow">›</span>}
          </span>
        ))}
      </div>
      <div className="dk-search">
        <GameIcon name="filter" size={12} />
        <span>Buscar partido, equipo, miembro…</span>
        <span className="kbd">⌘K</span>
      </div>
      <div className="dk-pulse">
        <span className="dot" />
        {liveLabel}
      </div>
      {right}
    </div>
  )
}
