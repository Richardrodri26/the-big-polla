'use client'

import Link from 'next/link'
import { GameIcon } from '@/components/ui/game-icon'
import { GamePill } from '@/components/ui/game-pill'
import { TeamFlag } from '@/components/ui/team-flag'
import { DKTopbar } from '@/components/layout/dk-topbar'
import { useAppStore } from '@/store/app-store'
import { usePredictionStore } from '@/store/prediction-store'
import { getKickoffTime } from '@/lib/date-utils'
import type { Match } from '@/types/domain'

export function MatchDetailScreen({ match }: Readonly<{ match: Match }>) {
  const { openPredictor } = useAppStore()
  const localPred = usePredictionStore(s => s.getPrediction(match.id))
  const { home, away, state, score } = match
  const myPred = localPred ?? match.userPrediction ?? null
  const live = state === 'live'
  const final = state === 'final'
  const pending = state === 'pending'
  let time: string
  if (live) time = `${match.liveMinute ?? 0}'`
  else if (pending) time = getKickoffTime(match.kickoffAt)
  else time = 'FINAL'

  return (
    <div className="screen screen-anim">
      {/* Mobile topbar */}
      <div className="topbar">
        <Link href="/feed" className="icon-btn"><GameIcon name="back" /></Link>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">{match.stage.toUpperCase()}</div>
          <div className="topbar-title">MATCH</div>
        </div>
        <button className="icon-btn"><GameIcon name="share" size={16} /></button>
      </div>

      {/* Desktop topbar */}
      <DKTopbar crumbs={['MATCH FEED', `${home.code} vs ${away.code}`]} />

      {/* Mobile layout */}
      <div className="scroll md:hidden">
        <MobileMatchDetail
          match={match} myPred={myPred} time={time}
          live={live} final={final} pending={pending}
          score={score} home={home} away={away}
          openPredictor={openPredictor}
        />
      </div>

      {/* Desktop layout */}
      <div className="scroll hidden md:block">
        <div style={{ padding: '20px 0 0' }}>
          <Link href="/feed" className="dk-btn ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <GameIcon name="back" size={14} /> Volver
          </Link>
        </div>
        <DesktopMatchDetail
          match={match} myPred={myPred} time={time}
          live={live} final={final} pending={pending}
          score={score} home={home} away={away}
          openPredictor={openPredictor}
        />
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

// ─── Shared props ────────────────────────────────────────────────────────────

interface DetailProps {
  match: Match
  myPred: [number, number] | null
  time: string
  live: boolean
  final: boolean
  pending: boolean
  score: [number, number] | undefined
  home: Match['home']
  away: Match['away']
  openPredictor: (m: Match) => void
}

// ─── Mobile layout ───────────────────────────────────────────────────────────

function MobileMatchDetail({ match, myPred, time, live, final, pending, score, home, away, openPredictor }: Readonly<DetailProps>) {
  return (
    <>
      <div className="detail-hero" style={{ '--c1': `${home.c1}33`, '--c2': `${away.c1}33` } as React.CSSProperties}>
        <div className="detail-meta-row">
          <span>{match.venue}</span>
          {live && <span style={{ color: 'var(--signal)' }}>● {time}</span>}
          {final && <span>FINAL</span>}
          {pending && <span>{time}</span>}
        </div>
        <div className="detail-versus">
          <div className="detail-team">
            <TeamFlag team={home} size="lg" />
            <div className="name">{home.name}</div>
            <div className="t-meta">{home.code}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {(live || final) && score && (
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 64, letterSpacing: '-0.06em', lineHeight: 1 }}>
                {score[0]}<span style={{ color: 'var(--fg-faint)' }}>·</span>{score[1]}
              </div>
            )}
            {pending && <div className="detail-vs">VS</div>}
            {live && <GamePill tone="signal" dot>EN VIVO</GamePill>}
          </div>
          <div className="detail-team">
            <TeamFlag team={away} size="lg" />
            <div className="name">{away.name}</div>
            <div className="t-meta">{away.code}</div>
          </div>
        </div>
        <div className="detail-meta-row">
          <span>TU PRED · {myPred ? `${myPred[0]}–${myPred[1]}` : '—'}</span>
          <span>VS · LIGA · {match.predictionBreakdown?.total ?? 0} PRED</span>
        </div>
      </div>

      {match.timeline && (
        <div>
          <div className="section-head">
            <div className="num">EVENTOS</div>
            <div className="title">CRONOLOGÍA</div>
          </div>
          <div className="live-timeline">
            {[...match.timeline].reverse().map((e) => (
              <div className="live-event" key={`${e.min}-${e.head}`}>
                <div className="min">{e.min}&apos;</div>
                <div className="text">
                  <div className="head">{e.head}</div>
                  <div className="body">{e.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-head">
        <div className="num">LIGA · {match.predictionBreakdown?.total ?? 0} PRED</div>
        <div className="title">¿QUÉ DICE LA TRIBUNA?</div>
      </div>
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(() => {
          const bd = match.predictionBreakdown
          const tributaRows = bd
            ? [
                { who: `Gana ${home.name}`, pct: bd.homeWin, color: home.c1 },
                { who: 'Empate', pct: bd.draw, color: 'var(--fg-mute)' },
                { who: `Gana ${away.name}`, pct: bd.awayWin, color: away.c1 },
              ]
            : []
          if (tributaRows.length === 0) {
            return <div className="t-meta">Sin predicciones aún</div>
          }
          return tributaRows.map((row) => (
            <div key={row.who}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>{row.who}</span>
                <span className="t-num" style={{ fontSize: 13 }}>{row.pct}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${row.pct}%`, height: '100%', background: row.color }} />
              </div>
            </div>
          ))
        })()}
      </div>

      {pending && (
        <div style={{ padding: '0 20px 24px' }}>
          <button className="btn btn-primary btn-block" onClick={() => openPredictor(match)}>
            {myPred ? 'EDITAR PREDICCIÓN' : 'HACER PREDICCIÓN'} <span className="arrow">→</span>
          </button>
        </div>
      )}
      <div style={{ height: 90 }} />
    </>
  )
}

// ─── Desktop 2-col layout ────────────────────────────────────────────────────

function DesktopMatchDetail({ match, myPred, time, live, final, pending, score, home, away, openPredictor }: Readonly<DetailProps>) {
  return (
    <div className="dk-md">
      {/* Left: hero */}
      <div className="dk-md-hero" style={{ '--c1': `${home.c1}26`, '--c2': `${away.c1}26` } as React.CSSProperties}>
        <div className="t-meta" style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between' }}>
          <span>{match.stage} · {match.venue}</span>
          {live && <span style={{ color: 'var(--signal)' }}>● {time}</span>}
          {final && <span>FINAL</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <TeamFlag team={home} size="lg" />
            <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 24, letterSpacing: '-0.03em', textTransform: 'uppercase', fontVariationSettings: '"wdth" 75' }}>{home.name}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {(live || final) && score ? (
              <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 80, letterSpacing: '-0.06em', fontVariationSettings: '"wdth" 75', lineHeight: 0.9, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span>{score[0]}</span><span style={{ color: 'var(--fg-faint)' }}>·</span><span>{score[1]}</span>
              </div>
            ) : (
              <span style={{ fontSize: 32, color: 'var(--fg-faint)', fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, letterSpacing: '0.06em' }}>VS</span>
            )}
            {live && <GamePill tone="signal" dot>EN VIVO · {time}</GamePill>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <TeamFlag team={away} size="lg" />
            <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 24, letterSpacing: '-0.03em', textTransform: 'uppercase', fontVariationSettings: '"wdth" 75' }}>{away.name}</div>
          </div>
        </div>

        <div className="dk-divider" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <div className="t-eyebrow">TU PREDICCIÓN</div>
            <div className="t-h2" style={{ fontSize: 26, marginTop: 6 }}>{myPred ? `${myPred[0]} · ${myPred[1]}` : '—'}</div>
            {(live || final) && (
              <div className="dk-locked-pill" style={{ marginTop: 8 }}>
                <GameIcon name="lock" size={9} /> BLOQUEADA AL KICKOFF
              </div>
            )}
          </div>
          <div>
            <div className="t-eyebrow">PUNTOS POSIBLES</div>
            {(() => {
              let pts: string
              if (final) pts = match.pts ? `+${match.pts}` : '0'
              else pts = myPred ? '+5/+3/+1' : '0'
              return <div className="t-h2" style={{ fontSize: 26, marginTop: 6, color: 'var(--warn)' }}>{pts}</div>
            })()}
            <div className="t-meta">EXACTO · DIFF · GANADOR</div>
          </div>
          <div>
            <div className="t-eyebrow">RACHA EN JUEGO</div>
            <div className="t-h2" style={{ fontSize: 26, marginTop: 6, color: 'var(--warn)' }}>🔥 3×</div>
            <div className="t-meta">+3 PTS SI ACERTÁS</div>
          </div>
        </div>

        {pending && (
          <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={() => openPredictor(match)}>
            {myPred ? 'Editar predicción' : 'Bloquear predicción'} →
          </button>
        )}

        {(live || final) && (
          <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(255,61,113,0.08)', border: '1px solid rgba(255,61,113,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <GameIcon name="lock" size={14} color="var(--danger)" />
            <span className="t-meta" style={{ color: 'var(--fg-dim)', textTransform: 'none', letterSpacing: '0.02em', fontSize: 12 }}>
              {live ? 'Las predicciones están cerradas mientras el partido está en vivo.' : 'El partido finalizó. Las predicciones se cerraron al kickoff.'}
            </span>
          </div>
        )}
      </div>

      {/* Right: timeline + tribuna */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {match.timeline && (
          <div className="dk-card">
            <div className="t-eyebrow">CRONOLOGÍA · EVENTOS</div>
            <div className="dk-timeline" style={{ marginTop: 8 }}>
              {[...match.timeline].reverse().map((e) => (
                <div className="dk-timeline-event" key={`${e.min}-${e.head}`}>
                  <div className="min">{e.min}&apos;</div>
                  <div><div className="head">{e.head}</div><div className="body">{e.body}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="dk-card">
          <div className="t-eyebrow">LIGA · {match.predictionBreakdown?.total ?? 0} PREDICCIONES</div>
          <div className="t-h3" style={{ fontSize: 16, marginTop: 4, marginBottom: 14 }}>¿QUÉ DICE LA TRIBUNA?</div>
          {(() => {
            const bd = match.predictionBreakdown
            const tributaRows = bd
              ? [
                  { who: `Gana ${home.name}`, pct: bd.homeWin, color: home.c1 },
                  { who: 'Empate', pct: bd.draw, color: 'rgba(255,255,255,0.3)' },
                  { who: `Gana ${away.name}`, pct: bd.awayWin, color: away.c1 },
                ]
              : []
            if (tributaRows.length === 0) {
              return <div className="t-meta">Sin predicciones aún</div>
            }
            return tributaRows.map(r => (
              <div className="dk-tribuna-row" key={r.who}>
                <div className="head"><span className="label">{r.who}</span><span className="pct">{r.pct}%</span></div>
                <div className="bar"><div style={{ width: `${r.pct}%`, background: r.color }} /></div>
              </div>
            ))
          })()
          }
        </div>
      </div>
    </div>
  )
}
