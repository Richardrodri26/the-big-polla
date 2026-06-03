'use client'

import { useState } from 'react'
import { TeamFlag } from '@/components/ui/team-flag'
import type { PredictionHistoryItem } from '@/types/domain'

type ResultKind = 'exact' | 'diff' | 'winner' | 'miss'

function classifyItem(item: PredictionHistoryItem): ResultKind | null {
  if (!item.result || !item.scoreLog) return null
  const log = item.scoreLog
  if (log.goalsHome > 0 && log.goalsAway > 0) return 'exact'
  if (log.diff > 0) return 'diff'
  if (log.winner > 0) return 'winner'
  return 'miss'
}

const RESULT_CONFIG: Record<ResultKind, { label: string; color: string; bg: string }> = {
  exact: { label: 'EXACTO', color: 'var(--warn)', bg: 'rgba(255,214,10,0.15)' },
  diff: { label: 'DIFERENCIA', color: 'var(--signal)', bg: 'rgba(0,210,106,0.12)' },
  winner: { label: 'GANADOR', color: 'var(--fg-dim)', bg: 'rgba(255,255,255,0.06)' },
  miss: { label: 'MISS', color: 'var(--fg-faint)', bg: 'rgba(255,255,255,0.03)' },
}

interface Props {
  initialItems: PredictionHistoryItem[]
  initialNextCursor: string | null
  leagueId?: string
}

export function PredictionHistoryList({ initialItems, initialNextCursor, leagueId }: Props) {
  const [items, setItems] = useState(initialItems)
  const [cursor, setCursor] = useState(initialNextCursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function loadMore() {
    if (!cursor) return
    setLoadingMore(true)
    const params = new URLSearchParams({ cursor, limit: '10' })
    if (leagueId) params.set('leagueId', leagueId)
    const res = await fetch(`/api/profile/history?${params}`)
    const data = await res.json()
    setItems(prev => [...prev, ...data.history])
    setCursor(data.nextCursor)
    setLoadingMore(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => {
          const kind = classifyItem(item)
          const cfg = kind ? RESULT_CONFIG[kind] : null
          const isExpanded = expandedId === item.matchId
          return (
            <div key={item.matchId}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.matchId)}
                className="card"
                style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: item.scoreLog ? 'pointer' : 'default' }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  <TeamFlag team={item.home} size="xs" />
                  <TeamFlag team={item.away} size="xs" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="t-h3" style={{ fontSize: 13 }}>
                    {item.home.code} {item.result ? `${item.result[0]}–${item.result[1]}` : 'vs'} {item.away.code}
                  </div>
                  <div className="t-meta">
                    TU: {item.prediction ? `${item.prediction[0]}–${item.prediction[1]}` : '—'} · {item.stage}
                  </div>
                </div>
                {cfg && (
                  <span style={{ padding: '3px 8px', borderRadius: 6, background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 9, letterSpacing: '0.12em', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {cfg.label}
                  </span>
                )}
                <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 18, color: item.pts > 3 ? 'var(--signal)' : item.pts > 0 ? 'var(--warn)' : 'var(--fg-faint)', minWidth: 28, textAlign: 'right' }}>
                  {item.pts > 0 ? `+${item.pts}` : '0'}
                </div>
              </div>

              {isExpanded && item.scoreLog && (
                <div style={{ margin: '2px 0 6px', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '0 0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['Ganador/Empate', item.scoreLog.winner],
                    ['Goles local', item.scoreLog.goalsHome],
                    ['Goles visitante', item.scoreLog.goalsAway],
                    ['Diferencia', item.scoreLog.diff],
                    ['Bonus racha', item.scoreLog.streakBonus],
                  ].map(([label, pts]) => (
                    <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="t-meta" style={{ textTransform: 'none' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 800, fontSize: 13, color: Number(pts) > 0 ? 'var(--signal)' : 'var(--fg-faint)' }}>
                        {Number(pts) > 0 ? `+${pts}` : '0'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {items.length === 0 && (
          <p style={{ color: 'var(--fg-mute)', textAlign: 'center', padding: 32 }}>
            Aún no hay predicciones registradas.
          </p>
        )}
      </div>

      {cursor && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          style={{ width: '100%', padding: '10px', marginTop: 12, borderRadius: 10, background: 'transparent', border: '1px solid var(--line)', color: 'var(--fg-dim)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          {loadingMore ? 'Cargando...' : 'VER MÁS'}
        </button>
      )}
    </div>
  )
}
