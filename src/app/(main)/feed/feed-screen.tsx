'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import { TeamFlag } from '@/components/ui/team-flag'
import { DKTopbar } from '@/components/layout/dk-topbar'
import { useAppStore } from '@/store/app-store'
import { usePredictionStore } from '@/store/prediction-store'
import { getDayLabel, getDateNum, getKickoffTime, getKickoffIn, getMonthShort, getWeekday } from '@/lib/date-utils'
import type { Match } from '@/types/domain'

function FeedMatchCard({ match }: { match: Match }) {
  const { openPredictor } = useAppStore()
  const localPred = usePredictionStore(s => s.getPrediction(match.id))
  const { home, away, state, score } = match
  const live = state === 'live'
  const final = state === 'final'
  const pending = state === 'pending'
  const myPred = localPred ?? match.userPrediction ?? null

  const time = live ? `${match.liveMinute ?? 0}'` : pending ? getKickoffTime(match.kickoffAt) : 'FT'
  const kickoffIn = pending ? getKickoffIn(match.kickoffAt) : undefined

  const handleClick = () => { if (pending) openPredictor(match) }

  return (
    <div
      className={`match-card variant-tape ${state}`}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
      role={pending ? 'button' : undefined}
      tabIndex={pending ? 0 : undefined}
      style={{ cursor: pending ? 'pointer' : 'default' }}
    >
      <div className="match-stripes">
        <div className="match-stripe" style={{ background: home.c1 }} />
        <div className="match-stripe" style={{ background: away.c1 }} />
      </div>
      <div className="match-tape">
        <span>{match.stage} · {match.venue.split(',')[0]}</span>
        {live && <span className="live-pill"><span className="dot" />EN VIVO · {time}</span>}
        {final && <span style={{ color: 'var(--fg-mute)' }}>FT</span>}
        {pending && <span>{kickoffIn ?? time}</span>}
      </div>
      <div className="match-body">
        <div className="team-block">
          <TeamFlag team={home} />
          <div className="team-name" style={{ textAlign: 'center' }}>{home.name}</div>
          <div className="team-code">{home.code}</div>
        </div>
        <div className="center-vs">
          {(live || final) && score && (
            <div className="score-row">
              <span>{score[0]}</span><span className="sep">·</span><span>{score[1]}</span>
            </div>
          )}
          {pending && (
            <>
              <div className="kickoff-time">{time}</div>
              <div className="t-meta" style={{ fontSize: 9 }}>{getWeekday(match.kickoffAt)} {getDateNum(match.kickoffAt)}</div>
            </>
          )}
        </div>
        <div className="team-block right">
          <TeamFlag team={away} />
          <div className="team-name" style={{ textAlign: 'center' }}>{away.name}</div>
          <div className="team-code">{away.code}</div>
        </div>
      </div>
      <div className="match-foot">
        {pending && !myPred && <span className="pred-state"><GameIcon name="plus" size={12} /> SIN PREDICCIÓN</span>}
        {pending && myPred && <span className="pred-state set"><GameIcon name="check" size={12} /> TU: {myPred[0]}–{myPred[1]}</span>}
        {live && myPred && <span className="pred-state set">TU PRED · {myPred[0]}–{myPred[1]}</span>}
        {live && !myPred && <span className="pred-state miss">SIN PREDICCIÓN</span>}
        {final && myPred && (
          <span className={`pred-state ${(match.pts ?? 0) > 0 ? 'set' : 'miss'}`}>
            TU: {myPred[0]}–{myPred[1]} · {(match.pts ?? 0) > 0 ? 'ACIERTO' : 'FALLO'}
          </span>
        )}
        {final && (
          <span className="pts" title={match.streakBonus ? `Base +${match.basePts} · Racha +${match.streakBonus}` : ''}>
            {(match.pts ?? 0) > 0 ? `+${match.pts}` : '0'} PTS
            {(match.streakBonus ?? 0) > 0 && <span style={{ color: 'var(--warn)', marginLeft: 4 }}>·🔥+{match.streakBonus}</span>}
          </span>
        )}
        {pending && !match.locked && <span style={{ color: 'var(--signal)' }}>{myPred ? 'EDITAR ›' : 'PREDECIR ›'}</span>}
        {live && (
          <span style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <GameIcon name="lock" size={11} /> BLOQUEADA
          </span>
        )}
      </div>
    </div>
  )
}

interface FeedScreenProps {
  matches: Match[]
  me: {
    rank: number
    prevRank: number
    pts: number
    streak: number
    name: string
    color: string
  }
  leagueName: string
  totalMembers: number
  ptsBehindLeader: number
  weeklyPts: number
  currentMatchday: number | null
}

export function FeedScreen({ matches, me, leagueName, totalMembers, ptsBehindLeader, weeklyPts, currentMatchday }: FeedScreenProps) {
  const { openPredictor } = useAppStore()
  const [filter, setFilter] = useState<'all' | 'pred' | 'no'>('all')

  const groups = useMemo(() => {
    const byDay: Record<string, { kickoffAt: string; items: Match[] }> = {}
    for (const m of matches) {
      const label = getDayLabel(m.kickoffAt)
      if (!byDay[label]) byDay[label] = { kickoffAt: m.kickoffAt, items: [] }
      byDay[label].items.push(m)
    }
    return byDay
  }, [matches])

  const order = Object.keys(groups).sort((a, b) => {
    const priority = ['HOY', 'MAÑANA', 'AYER']
    const ai = priority.indexOf(a); const bi = priority.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1; if (bi !== -1) return 1
    return 0
  })

  const filtered = (items: Match[]) => {
    if (filter === 'pred') return items.filter(m => m.userPrediction)
    if (filter === 'no') return items.filter(m => !m.userPrediction)
    return items
  }

  const nextNoPred = matches.find(m => m.state === 'pending' && !m.userPrediction)
  const totalToday = groups['HOY']?.items.length ?? 0

  const rankDelta = me.prevRank - me.rank
  const rankDeltaLabel = rankDelta > 0
    ? `▲ SUBISTE ${rankDelta} ${rankDelta === 1 ? 'POSICIÓN' : 'POSICIONES'}`
    : rankDelta < 0
      ? `▼ BAJASTE ${Math.abs(rankDelta)} ${Math.abs(rankDelta) === 1 ? 'POSICIÓN' : 'POSICIONES'}`
      : 'SIN CAMBIOS'
  const rankDeltaColor = rankDelta > 0 ? 'var(--signal)' : rankDelta < 0 ? 'var(--danger)' : 'var(--fg-mute)'

  return (
    <div className="screen screen-anim">
      {/* Mobile topbar — hidden on desktop via CSS */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avi name={me.name} color={me.color} size={32} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">{`LIGA · ${leagueName}`}</div>
          <div className="topbar-title">THE BIG POLLA</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn" style={{ position: 'relative' }}>
            <GameIcon name="bell" size={18} />
            <span style={{ position: 'absolute', width: 8, height: 8, background: 'var(--danger)', borderRadius: 4, top: 6, right: 6, boxShadow: '0 0 0 2px var(--bg)' }} />
          </button>
        </div>
      </div>

      {/* Desktop topbar */}
      <DKTopbar crumbs={[`LIGA ${leagueName}`, 'MATCH FEED']} />

      {/* Desktop page header */}
      <div className="dk-page-head">
        <div>
          <div className="sub">{`JORNADA ${currentMatchday ?? '—'} · ${matches.length} PARTIDOS`}</div>
          <div className="title">PARTIDOS</div>
        </div>
        <div className="actions">
          <div className="dk-tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todos</button>
            <button className={filter === 'pred' ? 'active' : ''} onClick={() => setFilter('pred')}>Con predicción</button>
            <button className={filter === 'no' ? 'active' : ''} onClick={() => setFilter('no')}>Sin predicción</button>
          </div>
        </div>
      </div>

      {/* Mobile league bar */}
      <div className="md:hidden">
        <div className="league-bar">
          <span className="name">RANKING #{me.rank}</span>
          <span className="sep">·</span>
          <span>{me.pts} PTS</span>
          <span className="sep">·</span>
          <span style={{ color: 'var(--signal)' }}>{`+${weeklyPts} ESTA SEMANA`}</span>
        </div>
      </div>

      <div className="scroll">
        {/* Mobile KPI */}
        <div className="px-5 pt-3 md:hidden">
          <div className="kpi">
            <div>
              <span className="label">JORNADA</span>
              <span className="value">
              {currentMatchday !== null ? String(currentMatchday).padStart(2, '0') : '—'}
              <span className="small">/{totalMembers}</span>
            </span>
            </div>
            <div>
              <span className="label">HOY</span>
              <span className="value">{String(totalToday).padStart(2, '0')}</span>
            </div>
            <div>
              <span className="label">RACHA</span>
              <span className="value" style={{ color: 'var(--warn)' }}>{me.streak}<span className="small">×</span></span>
            </div>
          </div>
        </div>

        {/* Desktop KPI */}
        <div className="dk-section hidden md:block">
          <div className="dk-kpi-big">
            <div>
              <span className="label">TU POSICIÓN</span>
              <span className="value">#{me.rank}<span className="small">/{totalMembers}</span></span>
              <span className="foot" style={{ color: rankDeltaColor }}>{rankDeltaLabel}</span>
            </div>
            <div>
              <span className="label">PUNTOS TOTALES</span>
              <span className="value">{me.pts}</span>
              <span className="foot">{ptsBehindLeader > 0 ? `A ${ptsBehindLeader} DEL LÍDER` : 'LÍDER DE LA LIGA'}</span>
            </div>
            <div>
              <span className="label">RACHA ACTUAL</span>
              <span className="value" style={{ color: 'var(--warn)' }}>{me.streak}<span className="small">×</span></span>
              <span className="foot" style={{ color: 'var(--warn)' }}>+{me.streak} PTS BONUS / ACIERTO</span>
            </div>
            <div>
              <span className="label">JORNADA</span>
              <span className="value">
                {currentMatchday !== null ? String(currentMatchday).padStart(2, '0') : '—'}
                <span className="small">/{totalMembers}</span>
              </span>
              <span className="foot">{totalToday} PARTIDOS HOY</span>
            </div>
          </div>
        </div>

        {/* Nudge banner — mobile */}
        {nextNoPred && (
          <div className="px-5 pt-4 md:hidden">
            <div
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: 14, borderColor: 'rgba(255, 214, 10, 0.4)', background: 'linear-gradient(90deg, rgba(255, 214, 10, 0.08), transparent)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <div className="t-eyebrow" style={{ color: 'var(--warn)' }}>
                  ALERTA · {getKickoffIn(nextNoPred.kickoffAt) ?? 'HOY'}
                </div>
                <div className="t-h3" style={{ fontSize: 16 }}>
                  Te falta predecir {nextNoPred.home.code} vs {nextNoPred.away.code}
                </div>
              </div>
              <button className="btn btn-warn" style={{ padding: '10px 14px', fontSize: 12 }} onClick={() => openPredictor(nextNoPred)}>
                IR →
              </button>
            </div>
          </div>
        )}

        {/* Nudge banner — desktop */}
        {nextNoPred && (
          <div className="dk-section hidden md:block" style={{ paddingBottom: 0 }}>
            <div className="dk-nudge">
              <div style={{ flex: 1 }}>
                <div className="t-eyebrow" style={{ color: 'var(--warn)', marginBottom: 4 }}>
                  ALERTA · CIERRA EN {getKickoffIn(nextNoPred.kickoffAt) ?? 'PRONTO'}
                </div>
                <div className="t-h2" style={{ fontSize: 22 }}>
                  Te falta predecir {nextNoPred.home.name} vs {nextNoPred.away.name}
                </div>
              </div>
              <button className="dk-btn warn" onClick={() => openPredictor(nextNoPred)}>
                Predecir ahora →
              </button>
            </div>
          </div>
        )}

        {/* Match groups */}
        {order.map((day) => {
          const g = groups[day]
          if (!g) return null
          const items = filtered(g.items)
          if (!items.length) return null
          return (
            <div key={day}>
              {/* Mobile day divider */}
              <div className="md:hidden">
                <div className="day-divider">
                  <div className="num">{getDateNum(g.kickoffAt)}</div>
                  <div className="stack">
                    <span className="label">{getWeekday(g.kickoffAt)} · {getMonthShort(g.kickoffAt)}</span>
                    <span className="meta">{day}</span>
                  </div>
                  <div className="rule" />
                  <div className="t-meta">{items.length} PARTIDOS</div>
                </div>
              </div>

              {/* Desktop section header */}
              <div className="dk-section hidden md:block" style={{ paddingBottom: 0 }}>
                <div className="dk-section-head">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                    <span style={{
                      fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 56,
                      letterSpacing: '-0.05em', fontVariationSettings: '"wdth" 75', lineHeight: 0.9,
                      color: day === 'AYER' ? 'var(--fg-mute)' : 'var(--fg)',
                    }}>
                      {getDateNum(g.kickoffAt)}
                    </span>
                    <div>
                      <div className="t-meta">{getWeekday(g.kickoffAt)} · {getMonthShort(g.kickoffAt)}</div>
                      <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{day}</div>
                    </div>
                  </div>
                  <div className="meta">{items.length} PARTIDOS</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] px-5 pb-1 md:px-0 md:pb-4">
                {items.map((m) =>
                  m.state !== 'pending' ? (
                    <Link key={m.id} href={`/feed/${m.id}`} style={{ textDecoration: 'none' }}>
                      <FeedMatchCard match={m} />
                    </Link>
                  ) : (
                    <FeedMatchCard key={m.id} match={m} />
                  )
                )}
              </div>
            </div>
          )
        })}
        <div style={{ height: 90 }} />
      </div>
    </div>
  )
}
