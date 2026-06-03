'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import { GamePill } from '@/components/ui/game-pill'
import { TeamFlag } from '@/components/ui/team-flag'
import { DKTopbar } from '@/components/layout/dk-topbar'
import { usePredictionStore } from '@/store/prediction-store'
import type { Badge, Match, Member, ScoreLogEntry } from '@/types/domain'

type ResultKind = 'exact' | 'diff' | 'winner' | 'miss'

function classifyResult(m: Match): ResultKind | null {
  if (m.state !== 'final') return null
  if (m.correctScore) return 'exact'
  if (m.correctOutcome) return m.basePts === 3 ? 'diff' : 'winner'
  return 'miss'
}

const RESULT_CONFIG: Record<ResultKind, { label: string; color: string; bg: string }> = {
  exact: { label: 'EXACTO', color: 'var(--warn)', bg: 'rgba(255,214,10,0.15)' },
  diff: { label: 'DIFERENCIA', color: 'var(--signal)', bg: 'rgba(0,210,106,0.12)' },
  winner: { label: 'GANADOR', color: 'var(--fg-dim)', bg: 'rgba(255,255,255,0.06)' },
  miss: { label: 'MISS', color: 'var(--fg-faint)', bg: 'rgba(255,255,255,0.03)' },
}

function PerformanceBar({ breakdown }: { breakdown: Member['breakdown'] }) {
  const { exact, diff, winner } = breakdown
  const miss = Math.max(0, 27 - exact - diff - winner)
  const total = exact + diff + winner + miss
  const segments = [
    { key: 'exact', count: exact, barColor: '#FFD60A', textColor: 'var(--warn)', label: 'EXACTO' },
    { key: 'diff', count: diff, barColor: '#00D26A', textColor: 'var(--signal)', label: 'DIFERENCIA' },
    { key: 'winner', count: winner, barColor: '#8B97AD', textColor: 'var(--fg-dim)', label: 'GANADOR' },
    { key: 'miss', count: miss, barColor: '#2A3248', textColor: 'var(--fg-faint)', label: 'MISS' },
  ] as const
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', gap: 2, background: 'var(--surface-2)' }}>
        {segments.map((s) => (
          <div key={s.key} style={{ flex: s.count / total, background: s.barColor, minWidth: s.count > 0 ? 4 : 0, opacity: s.key === 'miss' ? 0.35 : 0.9, transition: 'flex 0.4s ease' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {segments.map((s) => (
          <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="t-num" style={{ fontSize: 20, color: s.textColor, lineHeight: 1, letterSpacing: '-0.03em' }}>{s.count}</span>
            <span className="t-meta" style={{ fontSize: 8, letterSpacing: '0.1em' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchScoreLogDrawer({ entry, match, onClose }: {
  entry: ScoreLogEntry
  match: Match
  onClose: () => void
}) {
  const d = entry.detail
  const rows = [
    { label: 'Ganador/Empate', pts: d.winner, color: 'var(--fg)' },
    { label: 'Goles local exactos', pts: d.goalsHome, color: 'var(--signal)' },
    { label: 'Goles visitante exactos', pts: d.goalsAway, color: 'var(--signal)' },
    { label: 'Diferencia exacta', pts: d.diff, color: 'var(--signal)' },
    { label: 'Bonus racha', pts: d.streakBonus, color: 'var(--warn)' },
  ]
  return (
    <div style={{ padding: '16px 20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="t-eyebrow">DESGLOSE · {match.home.code} vs {match.away.code}</div>
          <div className="t-meta" style={{ marginTop: 4 }}>
            Pred: {d.prediction.home}–{d.prediction.away} · Real: {d.result.home}–{d.result.away}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><GameIcon name="close" size={14} /></button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--fg-dim)' }}>{r.label}</span>
            <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 16, color: r.pts > 0 ? r.color : 'var(--fg-faint)' }}>
              {r.pts > 0 ? `+${r.pts}` : '0'}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, marginTop: 4 }}>
          <span className="t-eyebrow">TOTAL</span>
          <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 24, letterSpacing: '-0.04em', color: entry.pts > 0 ? 'var(--signal)' : 'var(--fg-faint)' }}>
            +{entry.pts}
          </span>
        </div>
      </div>
    </div>
  )
}

interface ProfileScreenProps {
  me: Member
  members: Member[]
  finishedMatches: Match[]
  badges: Badge[]
  scoreLogs?: ScoreLogEntry[]
}

export function ProfileScreen({ me, members, finishedMatches, badges, scoreLogs }: ProfileScreenProps) {
  const getPrediction = usePredictionStore(s => s.getPrediction)
  const myIdx = members.findIndex(m => m.me)
  const sliceStart = Math.max(0, myIdx - 2)
  const miniRanking = members.slice(sliceStart, Math.min(members.length, myIdx + 3))
  const hitRate = me.hits > 0 ? Math.round((me.hits / 27) * 100) : 0
  const [selectedLogMatch, setSelectedLogMatch] = useState<{ match: Match; entry: ScoreLogEntry } | null>(null)
  const scoreLogMap = new Map((scoreLogs ?? []).map(l => [l.matchId, l]))

  return (
    <div className="screen screen-anim">
      {/* Mobile topbar */}
      <div className="topbar">
        <div style={{ width: 36 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">{me.handle.toUpperCase()}</div>
          <div className="topbar-title">MI PERFIL</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/settings" className="icon-btn"><GameIcon name="settings" size={16} /></Link>
        </div>
      </div>

      {/* Desktop topbar */}
      <DKTopbar crumbs={['MI CUENTA', 'PERFIL']} />

      {/* Desktop page header */}
      <div className="dk-page-head">
        <div>
          <div className="sub">{me.handle.toUpperCase()} · MIEMBRO DESDE MAY 2026</div>
          <div className="title">{me.name.toUpperCase()}</div>
        </div>
        <div className="actions">
          <button className="dk-btn ghost"><GameIcon name="share" size={14} /> Compartir perfil</button>
          <Link href="/settings" className="dk-btn primary">Editar perfil →</Link>
        </div>
      </div>

      <div className="scroll">
        {/* Mobile hero */}
        <div className="profile-hero md:hidden">
          <div className="profile-row">
            <Avi name={me.name} color={me.color} size={64} />
            <div style={{ flex: 1 }}>
              <div className="t-h2" style={{ fontSize: 26 }}>{me.name}</div>
              <div className="t-meta">RANK #{me.rank} · {me.pts} PTS</div>
            </div>
            <GamePill tone="signal" dot>+5 SEM</GamePill>
          </div>
          <div className="kpi">
            <div><span className="label">ACIERTOS</span><span className="value">{me.hits}<span className="small">/27</span></span></div>
            <div><span className="label">RACHA</span><span className="value" style={{ color: 'var(--warn)' }}>{me.streak}<span className="small">×</span></span></div>
            <div><span className="label">% HIT</span><span className="value">{hitRate}<span className="small">%</span></span></div>
          </div>
        </div>

        {/* Desktop KPI */}
        <div className="dk-section hidden md:block">
          <div className="dk-kpi-big">
            <div>
              <span className="label">POSICIÓN</span>
              <span className="value">#{me.rank}<span className="small">/12</span></span>
              <span className="foot" style={{ color: 'var(--signal)' }}>▲ +3 ESTA SEMANA</span>
            </div>
            <div>
              <span className="label">PUNTOS TOTALES</span>
              <span className="value">{me.pts}</span>
              <span className="foot">A 35 DEL LÍDER</span>
            </div>
            <div>
              <span className="label">% HIT</span>
              <span className="value">{hitRate}<span className="small">%</span></span>
              <span className="foot">{me.hits} ACIERTOS / 27 PRED</span>
            </div>
            <div>
              <span className="label">RACHA</span>
              <span className="value" style={{ color: 'var(--warn)' }}>{me.streak}<span className="small">×</span></span>
              <span className="foot" style={{ color: 'var(--warn)' }}>+{me.streak} PTS BONUS / ACIERTO</span>
            </div>
          </div>
        </div>

        {/* Mobile performance bar */}
        <div className="md:hidden" style={{ padding: '20px var(--gutter) 0' }}>
          <div className="section-head" style={{ padding: '0 0 12px' }}>
            <div className="num">27 PARTIDOS</div><div className="title">RENDIMIENTO</div>
          </div>
          <PerformanceBar breakdown={me.breakdown} />
        </div>

        {/* Desktop 2-col split */}
        <div className="dk-section hidden md:block">
          <div className="dk-split dk-split-2">
            {/* Left: badges + history */}
            <div>
              <div className="dk-section-head">
                <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 28, letterSpacing: '-0.03em', fontVariationSettings: '"wdth" 75' }}>
                  INSIGNIAS
                </span>
                <span className="meta">{badges.filter(b => b.unlocked).length} / {badges.length}</span>
              </div>
              <div className="dk-badge-grid">
                {badges.map((b) => (
                  <div key={b.id} className={`badge ${b.unlocked ? '' : 'locked'}`}>
                    <div className="num">{b.num}</div>
                    <div className="label">{b.label}</div>
                  </div>
                ))}
              </div>

              <div className="dk-section-head" style={{ marginTop: 32 }}>
                <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 28, letterSpacing: '-0.03em', fontVariationSettings: '"wdth" 75' }}>
                  HISTORIAL
                </span>
                <span className="meta">ÚLTIMAS PREDICCIONES</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {finishedMatches.map((m) => {
                  const localPred = getPrediction(m.id)
                  const displayPred = localPred ?? m.userPrediction
                  const kind = classifyResult(m)
                  const cfg = kind ? RESULT_CONFIG[kind] : null
                  return (
                    <div key={m.id} className="dk-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14, cursor: scoreLogMap.has(m.id) ? 'pointer' : 'default' }} onClick={() => { const entry = scoreLogMap.get(m.id); if (entry) setSelectedLogMatch({ match: m, entry }) }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <TeamFlag team={m.home} size="sm" />
                        <TeamFlag team={m.away} size="sm" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em' }}>
                          {m.home.code} {m.score?.[0]}–{m.score?.[1]} {m.away.code}
                        </div>
                        <div className="t-meta">TU: {displayPred ? `${displayPred[0]}–${displayPred[1]}` : '—'} · {m.stage}</div>
                      </div>
                      {cfg && <span style={{ padding: '3px 8px', borderRadius: 6, background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 9, letterSpacing: '0.12em', fontWeight: 700 }}>{cfg.label}</span>}
                      <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em', fontVariationSettings: '"wdth" 75', color: (m.pts ?? 0) > 3 ? 'var(--signal)' : (m.pts ?? 0) > 0 ? 'var(--warn)' : 'var(--fg-faint)', minWidth: 36, textAlign: 'right' }}>
                        {(m.pts ?? 0) > 0 ? `+${m.pts}` : '0'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: streak + points breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= me.streak ? 'var(--warn)' : 'rgba(255,255,255,0.06)' }} />
                  ))}
                </div>
              </div>

              {/* Points breakdown */}
              <div className="dk-card">
                <div className="t-eyebrow">DESGLOSE DE PUNTOS</div>
                <div className="t-h3" style={{ fontSize: 16, marginTop: 4 }}>¿CÓMO LLEGUÉ A {me.pts}?</div>
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Exactos', me.breakdown.exact, 5, 'var(--warn)'],
                    ['Diferencia', me.breakdown.diff, 3, 'var(--signal)'],
                    ['Ganador', me.breakdown.winner, 1, 'var(--fg)'],
                  ].map(([k, n, u, c]) => (
                    <div key={String(k)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flex: 1, fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--fg-dim)', textTransform: 'uppercase' }}>{k}</span>
                      <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>{n}×+{u}</span>
                      <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 14, fontVariationSettings: '"wdth" 75', letterSpacing: '-0.02em', color: String(c), minWidth: 36, textAlign: 'right' }}>+{Number(n) * Number(u)}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
                  {[
                    ['Bonus racha', me.breakdown.streakBonus, 'var(--warn)'],
                    ['Combo 5/5', me.breakdown.comboBonus, 'var(--signal)'],
                    ['Oracle parcial', me.breakdown.oraclePartial, '#A78BFA'],
                  ].map(([k, v, c]) => (
                    <div key={String(k)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flex: 1, fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--fg-dim)', textTransform: 'uppercase' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 14, fontVariationSettings: '"wdth" 75', letterSpacing: '-0.02em', color: String(c), minWidth: 36, textAlign: 'right' }}>+{v}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="t-eyebrow">TOTAL</span>
                    <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 28, letterSpacing: '-0.04em', fontVariationSettings: '"wdth" 75' }}>{me.pts}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile badges + ranking */}
        <div className="md:hidden">
          <div className="section-head">
            <div className="num">{badges.length} LOGROS</div><div className="title">INSIGNIAS</div>
          </div>
          <div className="badge-grid">
            {badges.map((b) => (
              <div key={b.id} className={`badge ${b.unlocked ? '' : 'locked'}`}>
                <div className="num">{b.num}</div><div className="label">{b.label}</div>
              </div>
            ))}
          </div>

          <div className="section-head">
            <div className="num">POSICIÓN #{me.rank} DE {members.length}</div>
            <div className="title">CLASIFICACIÓN</div>
          </div>
          <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--card-radius)', overflow: 'hidden', margin: '0 var(--gutter) 20px' }}>
            {miniRanking.map((m: Member) => {
              const delta = m.prevRank - m.rank
              const deltaCls = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
              const deltaStr = delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—'
              return (
                <div key={m.id} className={['lb-row', m.me ? 'me' : '', m.rank === 1 ? 'top-1' : m.rank === 2 ? 'top-2' : m.rank === 3 ? 'top-3' : ''].filter(Boolean).join(' ')}>
                  <div className="rank">{m.rank}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avi name={m.name} color={m.color} size={32} />
                    <div className="who">
                      <div className="name" style={{ fontSize: 14 }}>{m.name}{m.me && <span style={{ color: 'var(--signal)', marginLeft: 6, fontSize: 9, letterSpacing: '0.1em' }}>TÚ</span>}</div>
                      <div className="sub"><span>{m.hits} HITS</span>{m.streak > 0 && <span style={{ color: 'var(--warn)' }}>{m.streak}× RACHA</span>}</div>
                    </div>
                  </div>
                  <div className="pts" style={{ fontSize: 18 }}>{m.pts}<span className={`delta ${deltaCls}`}>{deltaStr}</span></div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '20px var(--gutter) 0' }}>
            <div className="section-head" style={{ padding: 0 }}>
              <div className="num">HISTÓRICO</div><div className="title">ÚLTIMAS PREDICCIONES</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {finishedMatches.map((m) => {
                const localPred = getPrediction(m.id)
                const displayPred = localPred ?? m.userPrediction
                const kind = classifyResult(m)
                const cfg = kind ? RESULT_CONFIG[kind] : null
                return (
                  <div key={m.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: scoreLogMap.has(m.id) ? 'pointer' : 'default' }} onClick={() => { const entry = scoreLogMap.get(m.id); if (entry) setSelectedLogMatch({ match: m, entry }) }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <TeamFlag team={m.home} size="xs" />
                      <TeamFlag team={m.away} size="xs" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="t-h3" style={{ fontSize: 13 }}>{m.home.code} {m.score?.[0]}–{m.score?.[1]} {m.away.code}</div>
                      <div className="t-meta">TU: {displayPred ? `${displayPred[0]}–${displayPred[1]}` : '—'} · {m.stage}</div>
                    </div>
                    {cfg && <span style={{ padding: '3px 8px', borderRadius: 6, background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 9, letterSpacing: '0.12em', fontWeight: 700, whiteSpace: 'nowrap' }}>{cfg.label}</span>}
                    <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 18, color: (m.pts ?? 0) > 3 ? 'var(--signal)' : (m.pts ?? 0) > 0 ? 'var(--warn)' : 'var(--fg-faint)', minWidth: 28, textAlign: 'right' }}>
                      {(m.pts ?? 0) > 0 ? `+${m.pts}` : '0'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {selectedLogMatch && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }} onClick={() => setSelectedLogMatch(null)}>
            <div style={{
              background: 'var(--bg)', borderRadius: '20px 20px 0 0',
              width: '100%', maxWidth: 480,
            }} onClick={e => e.stopPropagation()}>
              <MatchScoreLogDrawer
                entry={selectedLogMatch.entry}
                match={selectedLogMatch.match}
                onClose={() => setSelectedLogMatch(null)}
              />
            </div>
          </div>
        )}

        <div style={{ height: 96 }} />
      </div>
    </div>
  )
}
