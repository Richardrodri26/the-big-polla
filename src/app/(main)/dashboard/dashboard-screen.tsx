'use client'

import Link from 'next/link'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import { TeamFlag } from '@/components/ui/team-flag'
import { DKTopbar } from '@/components/layout/dk-topbar'
import { useAppStore } from '@/store/app-store'
import { usePredictionStore } from '@/store/prediction-store'
import { getDayLabel, getKickoffIn } from '@/lib/date-utils'
import { BRACKET } from '@/lib/oracle-data'
import type { Match, Member } from '@/types/domain'

interface DashboardScreenProps {
  matches: Match[]
  members: Member[]
  leagueName: string
  totalFinalMatches: number
  weeklyPts: number
  currentMatchday: number | null
}

export function DashboardScreen({ matches, members, leagueName, totalFinalMatches, weeklyPts, currentMatchday }: DashboardScreenProps) {
  const { openPredictor } = useAppStore()
  const getPrediction = usePredictionStore(s => s.getPrediction)

  const me = members.find(m => m.me)!
  const liveMatches = matches.filter(m => m.state === 'live')
  const todayPending = matches.filter(m => m.state === 'pending' && getDayLabel(m.kickoffAt) === 'HOY')
  const nextNoPred = matches.find(m => m.state === 'pending' && !m.userPrediction && !getPrediction(m.id))

  const rankDelta = me.prevRank - me.rank
  const rankDeltaLabel = rankDelta > 0
    ? `▲ SUBISTE ${rankDelta} ${rankDelta === 1 ? 'POSICIÓN' : 'POSICIONES'} ESTA SEMANA`
    : rankDelta < 0
      ? `▼ BAJASTE ${Math.abs(rankDelta)} ${Math.abs(rankDelta) === 1 ? 'POSICIÓN' : 'POSICIONES'} ESTA SEMANA`
      : 'SIN CAMBIOS ESTA SEMANA'
  const rankDeltaColor = rankDelta > 0 ? 'var(--signal)' : rankDelta < 0 ? 'var(--danger)' : 'var(--fg-mute)'

  const sortedByPts = [...members].sort((a, b) => b.pts - a.pts)
  const leader = sortedByPts[0]
  const third = sortedByPts[2]
  const ptsBehindLeader = leader && leader.id !== me.id ? leader.pts - me.pts : 0
  const ptsBehindThird = third && me.rank > 3 ? third.pts - me.pts : 0

  const ptsGapLabel = ptsBehindLeader > 0
    ? ptsBehindThird > 0
      ? `A ${ptsBehindLeader} DEL LÍDER · A ${ptsBehindThird} DEL #3`
      : `A ${ptsBehindLeader} DEL LÍDER`
    : 'LÍDER DE LA LIGA'

  return (
    <div className="screen screen-anim">
      {/* Mobile topbar */}
      <div className="topbar">
        <Avi name={me.name} color={me.color} size={32} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">{`LIGA · ${leagueName}`}</div>
          <div className="topbar-title">DASHBOARD</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/feed" className="icon-btn"><GameIcon name="feed" size={18} /></Link>
        </div>
      </div>

      {/* Desktop topbar */}
      <DKTopbar crumbs={[`LIGA ${leagueName}`, 'DASHBOARD']} />

      {/* Desktop page header */}
      <div className="dk-page-head">
        <div>
          <div className="sub">{`JORNADA ${currentMatchday ?? '—'} · ${new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}`}</div>
          <div className="title">{`HOLA ${me.name.toUpperCase()}.`}</div>
        </div>
        <div className="actions">
          <Link href="/feed" className="dk-btn primary">Ver partidos del día →</Link>
        </div>
      </div>

      <div className="scroll">
        {/* Mobile KPI */}
        <div className="md:hidden px-5 pt-3">
          <div className="kpi">
            <div><span className="label">POSICIÓN</span><span className="value">#{me.rank}<span className="small">/{members.length}</span></span></div>
            <div><span className="label">PUNTOS</span><span className="value">{me.pts}</span></div>
            <div><span className="label">RACHA</span><span className="value" style={{ color: 'var(--warn)' }}>{me.streak}<span className="small">×</span></span></div>
          </div>
        </div>

        {/* Desktop KPI */}
        <div className="dk-section hidden md:block">
          <div className="dk-kpi-big">
            <div>
              <span className="label">TU POSICIÓN</span>
              <span className="value">#{me.rank}<span className="small">/{members.length}</span></span>
              <span className="foot" style={{ color: rankDeltaColor }}>{rankDeltaLabel}</span>
            </div>
            <div>
              <span className="label">PUNTOS TOTALES</span>
              <span className="value">{me.pts}</span>
              <span className="foot">{ptsGapLabel}</span>
            </div>
            <div>
              <span className="label">RACHA ACTUAL</span>
              <span className="value" style={{ color: 'var(--warn)' }}>{me.streak}<span className="small">×</span></span>
              <span className="foot" style={{ color: 'var(--warn)' }}>+{me.streak} PTS BONUS POR ACIERTO</span>
            </div>
            <div>
              <span className="label">ACIERTOS · % HIT</span>
              <span className="value">{me.hits}<span className="small">/{totalFinalMatches}</span></span>
              <span className="foot">{totalFinalMatches > 0 ? `${Math.round(me.hits / totalFinalMatches * 100)}% PRECISIÓN GLOBAL` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Nudge — mobile */}
        {nextNoPred && (
          <div className="md:hidden px-5 pt-4">
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, borderColor: 'rgba(255,214,10,0.4)', background: 'linear-gradient(90deg, rgba(255,214,10,0.08), transparent)' }}>
              <div style={{ flex: 1 }}>
                <div className="t-eyebrow" style={{ color: 'var(--warn)' }}>ALERTA · {getKickoffIn(nextNoPred.kickoffAt) ?? 'HOY'}</div>
                <div className="t-h3" style={{ fontSize: 16 }}>Falta predecir {nextNoPred.home.code} vs {nextNoPred.away.code}</div>
              </div>
              <button className="btn btn-warn" style={{ padding: '10px 14px', fontSize: 12 }} onClick={() => openPredictor(nextNoPred)}>IR →</button>
            </div>
          </div>
        )}

        {/* Nudge — desktop */}
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
              <button className="dk-btn warn" onClick={() => openPredictor(nextNoPred)}>Predecir ahora →</button>
            </div>
          </div>
        )}

        {/* Mobile match list */}
        <div className="md:hidden">
          <div className="section-head"><div className="num">EN VIVO</div><div className="title">AHORA</div></div>
          <div className="px-5" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
            {liveMatches.map(m => (
              <Link key={m.id} href={`/feed/${m.id}`} style={{ textDecoration: 'none' }}>
                <DashboardMatchRow match={m} />
              </Link>
            ))}
          </div>
          <div className="section-head"><div className="num">HOY</div><div className="title">PENDIENTES</div></div>
          <div className="px-5" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
            {todayPending.map(m => <DashboardMatchRow key={m.id} match={m} onClick={() => openPredictor(m)} />)}
          </div>
        </div>

        {/* Desktop 2-col split */}
        <div className="dk-section hidden md:block">
          <div className="dk-split dk-split-2">
            <DashboardLeft liveMatches={liveMatches} todayPending={todayPending} onOpenPredictor={openPredictor} />
            <DashboardRight members={members} me={me} />
          </div>
        </div>

        <div style={{ height: 90 }} />
      </div>
    </div>
  )
}

// ─── Fila de partido compacta — mobile ───────────────────────────────────────

function DashboardMatchRow({ match, onClick }: { match: Match; onClick?: () => void }) {
  const { home, away, state, score } = match
  return (
    <div
      className={`match-card variant-tape ${state}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="match-stripes">
        <div className="match-stripe" style={{ background: home.c1 }} />
        <div className="match-stripe" style={{ background: away.c1 }} />
      </div>
      <div className="match-tape">
        <span>{match.stage} · {match.venue.split(',')[0]}</span>
        {state === 'live' && <span className="live-pill"><span className="dot" />EN VIVO</span>}
      </div>
      <div className="match-body">
        <div className="team-block"><TeamFlag team={home} /><div className="team-name">{home.name}</div></div>
        <div className="center-vs">
          {state === 'live' && score && <div className="score-row"><span>{score[0]}</span><span className="sep">·</span><span>{score[1]}</span></div>}
          {state === 'pending' && <div className="kickoff-time">{match.kickoffAt ? new Date(match.kickoffAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>}
        </div>
        <div className="team-block right"><TeamFlag team={away} /><div className="team-name">{away.name}</div></div>
      </div>
    </div>
  )
}

// ─── Columna izquierda desktop ───────────────────────────────────────────────

function DashboardLeft({ liveMatches, todayPending, onOpenPredictor }: {
  liveMatches: Match[]
  todayPending: Match[]
  onOpenPredictor: (m: Match) => void
}) {
  return (
    <div>
      {liveMatches.length > 0 && (
        <>
          <div className="dk-section-head" style={{ marginBottom: 12 }}>
            <div>
              <div className="dk-pulse" style={{ marginBottom: 4 }}><span className="dot" />EN VIVO AHORA</div>
              <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 28, letterSpacing: '-0.03em', fontVariationSettings: '"wdth" 75' }}>
                PARTIDOS EN CURSO
              </span>
            </div>
            <Link href="/feed" className="dk-btn ghost" style={{ fontSize: 11 }}>Ver todo →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {liveMatches.map(m => (
              <Link key={m.id} href={`/feed/${m.id}`} style={{ textDecoration: 'none' }}>
                <DashboardMatchRow match={m} />
              </Link>
            ))}
          </div>
        </>
      )}

      {todayPending.length > 0 && (
        <>
          <div className="dk-section-head" style={{ marginTop: 28, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 28, letterSpacing: '-0.03em', fontVariationSettings: '"wdth" 75' }}>
              HOY · PENDIENTES
            </span>
            <span className="t-meta">{todayPending.length} PARTIDOS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todayPending.map(m => (
              <DashboardMatchRow key={m.id} match={m} onClick={() => onOpenPredictor(m)} />
            ))}
          </div>
        </>
      )}

      {liveMatches.length === 0 && todayPending.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <div className="t-eyebrow">SIN PARTIDOS HOY</div>
          <Link href="/feed" className="dk-btn ghost" style={{ marginTop: 16 }}>Ver todos los partidos →</Link>
        </div>
      )}
    </div>
  )
}

// ─── Columna derecha desktop ─────────────────────────────────────────────────

function DashboardRight({ members, me }: { members: Member[]; me: Member }) {
  let oraclePicked = 0; let oracleTotal = 0
  Object.values(BRACKET).forEach((round: unknown) => {
    (round as Array<{ top: unknown; bot: unknown; picked: unknown }>).forEach(s => {
      if (s.top || s.bot) oracleTotal++
      if (s.picked) oraclePicked++
    })
  })
  const oraclePct = oracleTotal > 0 ? Math.round(oraclePicked / oracleTotal * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mini leaderboard */}
      <div className="dk-card">
        <div className="dk-section-head" style={{ marginBottom: 12 }}>
          <div>
            <div className="t-eyebrow" style={{ fontSize: 9 }}>RANKING · GLOBAL</div>
            <div className="t-h3" style={{ fontSize: 16, marginTop: 2 }}>LEADERBOARD</div>
          </div>
          <Link href="/leaderboard" className="dk-btn ghost" style={{ padding: '6px 10px', fontSize: 10 }}>Todos →</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.slice(0, 6).map((m, i) => {
            const delta = m.prevRank - m.rank
            const deltaCls = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
            return (
              <div key={m.id} style={{
                display: 'grid', gridTemplateColumns: '26px 1fr auto auto', alignItems: 'center', gap: 10,
                padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--line)' : 0,
                background: m.me ? 'linear-gradient(90deg, rgba(0,210,106,0.06), transparent)' : undefined,
                paddingLeft: m.me ? 8 : 0,
                borderLeft: m.me ? '2px solid var(--signal)' : undefined,
              }}>
                <div style={{
                  fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 16,
                  letterSpacing: '-0.03em', fontVariationSettings: '"wdth" 75',
                  color: m.rank === 1 ? 'var(--warn)' : m.rank === 2 ? '#C7CACE' : m.rank === 3 ? '#D08350' : 'var(--fg)',
                }}>{m.rank}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avi name={m.name} color={m.color} size={24} />
                  <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 800, fontSize: 13, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.name}
                  </span>
                </div>
                <span className={`delta ${deltaCls}`} style={{ fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 9 }}>
                  {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—'}
                </span>
                <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 14, letterSpacing: '-0.02em', fontVariationSettings: '"wdth" 75', textAlign: 'right', minWidth: 40 }}>
                  {m.pts}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Streak card */}
      <div className="dk-card" style={{ background: 'linear-gradient(135deg, rgba(255,214,10,0.10), transparent 60%), var(--surface)', borderColor: 'rgba(255,214,10,0.3)' }}>
        <div className="t-eyebrow" style={{ color: 'var(--warn)' }}>🔥 RACHA ACTIVA · BONUS POR ACIERTO</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
          <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 60, letterSpacing: '-0.06em', fontVariationSettings: '"wdth" 75', color: 'var(--warn)', lineHeight: 1 }}>
            {me.streak}<span style={{ fontSize: 28, color: 'var(--fg-mute)' }}>×</span>
          </span>
          <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', color: 'var(--warn)' }}>
            +{me.streak} PTS
          </span>
        </div>
        <div className="t-body" style={{ marginTop: 8, fontSize: 12 }}>
          Cada acierto suma <b style={{ color: 'var(--warn)' }}>+1 pt por nivel de racha</b> (máx +5/partido).
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= me.streak ? 'var(--warn)' : 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      </div>

      {/* Oracle progress */}
      <div className="dk-card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.10), transparent 60%), var(--surface)', borderColor: 'rgba(124,58,237,0.3)' }}>
        <div className="t-eyebrow" style={{ color: '#A78BFA' }}>★ BRACKET ORACLE · +50 PTS</div>
        <div className="t-h3" style={{ fontSize: 18, marginTop: 6 }}>{oraclePicked} DE {oracleTotal} PICKS</div>
        <div style={{ marginTop: 10, height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${oraclePct}%`, height: '100%', background: 'linear-gradient(90deg, #A78BFA, #7C3AED)' }} />
        </div>
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="t-meta">PROGRESO</span>
          <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 16 }}>{oraclePct}%</span>
        </div>
        <Link href="/oracle" className="dk-btn ghost" style={{ marginTop: 12, width: '100%', justifyContent: 'center', display: 'flex' }}>
          Continuar bracket →
        </Link>
      </div>
    </div>
  )
}
