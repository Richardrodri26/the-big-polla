'use client'

import { useState } from 'react'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import { DKTopbar } from '@/components/layout/dk-topbar'
import { ResponsiveDialog, ResponsiveDialogContent } from '@/components/ui/responsive-dialog'
import type { Member, ScoringRules } from '@/types/domain'

function BreakdownRows({ member, rules }: { member: Member; rules: ScoringRules }) {
  const b = member.breakdown
  const lines = [
    { k: 'exact', label: 'Resultado exacto', count: b.exact, unit: rules.exact, color: 'var(--warn)', bg: 'rgba(255,214,10,0.18)', icon: '★' },
    { k: 'diff', label: 'Diferencia de gol', count: b.diff, unit: rules.diff, color: 'var(--signal)', bg: 'rgba(0,210,106,0.18)', icon: 'Δ' },
    { k: 'winner', label: 'Solo ganador / empate', count: b.winner, unit: rules.winner, color: 'var(--fg)', bg: 'rgba(255,255,255,0.06)', icon: '✓' },
  ]
  const subtotalBase = lines.reduce((s, l) => s + l.count * l.unit, 0)
  const totalBonus = b.streakBonus + b.comboBonus + b.oraclePartial
  const total = subtotalBase + totalBonus
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <div className="t-meta">RANK #{member.rank} · {member.handle}</div>
          <div className="t-h2" style={{ fontSize: 22, marginTop: 4 }}>{total} PUNTOS</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: member.streak > 0 ? 'rgba(255,214,10,0.18)' : 'rgba(255,255,255,0.05)', color: member.streak > 0 ? 'var(--warn)' : 'var(--fg-mute)', fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {member.streak > 0 && <span style={{ width: 6, height: 6, borderRadius: 3, background: 'currentColor', display: 'inline-block' }} />}
          {member.streak}× RACHA
        </span>
      </div>

      <div className="t-eyebrow" style={{ marginBottom: 10 }}>A · ACIERTOS POR TIPO</div>
      {lines.map((l) => (
        <div key={l.k} className="dk-pts-line">
          <div className="iconbox" style={{ background: l.bg, color: l.color }}>{l.icon}</div>
          <div>
            <div className="lbl">{l.label}</div>
            <div className="desc">+{l.unit} pts × acierto</div>
          </div>
          <div className="count">×{l.count}</div>
          <div className="total" style={{ color: l.color }}>+{l.count * l.unit}</div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', marginTop: 6, borderTop: '1px dashed var(--line)' }}>
        <span className="t-meta">SUBTOTAL BASE</span>
        <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 18, fontVariationSettings: '"wdth" 75', letterSpacing: '-0.03em' }}>+{subtotalBase}</span>
      </div>

      <div className="t-eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>B · BONIFICACIONES</div>
      <div className="dk-pts-line" style={{ background: 'linear-gradient(90deg, rgba(255,214,10,0.10), rgba(255,214,10,0.02))', borderColor: 'rgba(255,214,10,0.3)' }}>
        <div className="iconbox" style={{ background: 'rgba(255,214,10,0.2)' }}>
          <GameIcon name="fire" size={14} color="var(--warn)" />
        </div>
        <div>
          <div className="lbl">Bonus por racha</div>
          <div className="desc">+1 pt × nivel (máx +5 / partido)</div>
        </div>
        <div className="count">{member.streak}× actual</div>
        <div className="total" style={{ color: 'var(--warn)' }}>+{b.streakBonus}</div>
      </div>
      <div className="dk-pts-line" style={{ background: 'rgba(0,210,106,0.06)', borderColor: 'rgba(0,210,106,0.25)' }}>
        <div className="iconbox" style={{ background: 'rgba(0,210,106,0.2)', color: 'var(--signal)', fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900 }}>5</div>
        <div>
          <div className="lbl">Pleno de jornada (5/5)</div>
          <div className="desc">+{rules.combo} pts por jornada perfecta</div>
        </div>
        <div className="count">×{Math.round(b.comboBonus / rules.combo)}</div>
        <div className="total" style={{ color: 'var(--signal)' }}>+{b.comboBonus}</div>
      </div>
      <div className="dk-pts-line" style={{ background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.25)' }}>
        <div className="iconbox" style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA', fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900 }}>★</div>
        <div>
          <div className="lbl">Oracle (bracket parcial)</div>
          <div className="desc">Picks acertados en rondas eliminatorias</div>
        </div>
        <div className="count">parcial</div>
        <div className="total" style={{ color: '#A78BFA' }}>+{b.oraclePartial}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', marginTop: 6, borderTop: '1px dashed var(--line)' }}>
        <span className="t-meta">SUBTOTAL BONUS</span>
        <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 18, fontVariationSettings: '"wdth" 75', letterSpacing: '-0.03em' }}>+{totalBonus}</span>
      </div>

      <div style={{ marginTop: 24, padding: 18, background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="t-eyebrow">TOTAL · AUDITABLE</div>
          <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em', fontSize: 11, marginTop: 4 }}>
            {subtotalBase} base + {totalBonus} bonus
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 44, fontVariationSettings: '"wdth" 75', letterSpacing: '-0.05em' }}>{total}</div>
      </div>
    </>
  )
}

interface LeaderboardScreenProps {
  members: Member[]
  scoringRules: ScoringRules
}

export function LeaderboardScreen({ members, scoringRules }: LeaderboardScreenProps) {
  const [tab, setTab] = useState('global')
  const [selected, setSelected] = useState<Member | null>(null)
  const [breakdownFor, setBreakdownFor] = useState<Member | null>(null)

  const openBreakdown = (m: Member) => {
    setSelected(m)
    setBreakdownFor(m)
  }

  return (
    <div className="screen screen-anim">
      {/* Mobile topbar */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="icon-btn"><GameIcon name="filter" size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">LIGA · AMIGOS DEL BAR</div>
          <div className="topbar-title">LEADERBOARD</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn"><GameIcon name="fire" size={16} color="var(--warn)" /></button>
        </div>
      </div>

      {/* Desktop topbar */}
      <DKTopbar crumbs={['LIGA AMIGOS DEL BAR', 'LEADERBOARD']} />

      {/* Desktop page header */}
      <div className="dk-page-head">
        <div>
          <div className="sub">{members.length} MIEMBROS · ACTUALIZADO HACE 2 MIN</div>
          <div className="title">RANKING</div>
        </div>
        <div className="actions">
          <div className="dk-tabs">
            <button className={tab === 'global' ? 'active' : ''} onClick={() => setTab('global')}>Global</button>
            <button className={tab === 'week' ? 'active' : ''} onClick={() => setTab('week')}>Semanal</button>
            <button className={tab === 'j4' ? 'active' : ''} onClick={() => setTab('j4')}>Jornada 4</button>
          </div>
        </div>
      </div>

      {/* ─── MOBILE layout ─── */}
      <div className="flex flex-col lg:flex-row lg:flex-1 lg:overflow-hidden md:hidden">
        <div className="lg:w-[380px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-[var(--line)]">
          <div style={{ display: 'flex', gap: 6, padding: '8px 20px 12px' }}>
            {[{ id: 'global', label: 'Global' }, { id: 'week', label: 'Semanal' }, { id: 'j4', label: 'J4' }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: tab === t.id ? 'var(--fg)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#04130A' : 'var(--fg-dim)', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 8, alignItems: 'end' }}>
            {[1, 0, 2].map((idx) => {
              const m = members[idx]; if (!m) return null
              const heights = [110, 86, 72]; const place = m.rank
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Avi name={m.name} color={m.color} size={place === 1 ? 56 : 44} />
                  <div className="t-h3" style={{ fontSize: place === 1 ? 14 : 12, textAlign: 'center' }}>{m.name.split(' ')[0]}</div>
                  <div className="t-num" style={{ fontSize: place === 1 ? 24 : 18, color: place === 1 ? 'var(--warn)' : 'var(--fg)' }}>{m.pts}</div>
                  <div style={{ height: heights[idx], width: '100%', background: place === 1 ? 'linear-gradient(180deg, var(--warn), transparent 130%)' : place === 2 ? 'linear-gradient(180deg, #C7CACE, transparent 130%)' : 'linear-gradient(180deg, #D08350, transparent 130%)', borderRadius: '10px 10px 0 0', position: 'relative', opacity: 0.92 }}>
                    <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--display)', fontWeight: 900, fontSize: place === 1 ? 28 : 22, color: 'rgba(0,0,0,0.55)' }}>{place}°</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex-1 scroll">
          <div className="section-head">
            <div className="num">RANKING · {members.length}</div>
            <div className="title">CLASIFICACIÓN</div>
          </div>
          {members.map((m) => {
            const delta = m.prevRank - m.rank
            const deltaCls = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
            return (
              <div key={m.id} onClick={() => openBreakdown(m)} className={`lb-row ${m.me ? 'me' : ''} ${m.rank === 1 ? 'top-1' : m.rank === 2 ? 'top-2' : m.rank === 3 ? 'top-3' : ''}`} style={{ cursor: 'pointer' }}>
                <div className="rank">{m.rank}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <Avi name={m.name} color={m.color} size={36} />
                  <div className="who">
                    <div className="name">{m.name}{m.me && <span style={{ color: 'var(--signal)', marginLeft: 6, fontSize: 10, letterSpacing: '0.1em' }}>YOU</span>}</div>
                    <div className="sub">
                      <span>{m.handle}</span><span>{m.hits} HITS</span>
                      {m.streak > 0 && <span style={{ color: 'var(--warn)' }}>{m.streak}× RACHA</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <div className="pts">{m.pts}<span className={`delta ${deltaCls}`}>{delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—'}</span></div>
                  <div className="t-meta" style={{ fontSize: 9, color: 'var(--signal)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>VER DESGLOSE <GameIcon name="chevron-right" size={10} /></div>
                </div>
              </div>
            )
          })}
          <div style={{ height: 90 }} />
        </div>
      </div>

      {/* ─── DESKTOP layout ─── */}
      <div className="scroll hidden md:block" style={{ position: 'relative' }}>
        {/* Podium top 3 */}
        <div className="dk-section">
          <div className="dk-podium">
            {([1, 0, 2] as const).map((idx) => {
              const m = members[idx]; if (!m) return null
              const gold = idx === 0
              const silverBronzeColor = idx === 1 ? '#C7CACE' : '#D08350'
              return (
                <div key={m.id}
                  className={`dk-podium-card ${gold ? 'gold' : ''}`}
                  style={{ height: gold ? 200 : idx === 1 ? 170 : 150, cursor: 'pointer' }}
                  onClick={() => openBreakdown(m)}>
                  <div className="rank-badge" style={{ color: gold ? 'var(--warn)' : silverBronzeColor }}>{m.rank}°</div>
                  <Avi name={m.name} color={m.color} size={gold ? 56 : 44} />
                  <div className="name">{m.name}</div>
                  <div className="pts">{m.pts}</div>
                  <div className="t-meta" style={{ fontSize: 9 }}>{m.hits} HITS · {m.streak}× RACHA</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Full table */}
        <div className="dk-section" style={{ paddingTop: 0 }}>
          <div className="dk-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="dk-table">
              <thead>
                <tr>
                  <th style={{ width: 52 }}>RANK</th>
                  <th>MIEMBRO</th>
                  <th>ACIERTOS</th>
                  <th>RACHA</th>
                  <th>Δ POSICIÓN</th>
                  <th style={{ textAlign: 'right' }}>PUNTOS</th>
                  <th style={{ width: 130 }}></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const delta = m.prevRank - m.rank
                  const deltaCls = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
                  return (
                    <tr key={m.id}
                      className={`${m.me ? 'me' : ''} ${selected?.id === m.id ? 'selected' : ''} ${m.rank === 1 ? 'top-1' : m.rank === 2 ? 'top-2' : m.rank === 3 ? 'top-3' : ''}`}
                      onClick={() => openBreakdown(m)}>
                      <td className="rank">{m.rank}</td>
                      <td>
                        <div className="who">
                          <Avi name={m.name} color={m.color} size={32} />
                          <div>
                            <div className="name">{m.name}{m.me && <span style={{ color: 'var(--signal)', marginLeft: 6, fontSize: 9, letterSpacing: '0.12em' }}>YOU</span>}</div>
                            <div className="handle">{m.handle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num-cell">{m.hits}</td>
                      <td className="num-cell streak-cell">{m.streak > 0 ? `${m.streak}×` : '—'}</td>
                      <td className={`delta-cell`}>
                        <span className={`delta ${deltaCls}`}>
                          {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—'}
                        </span>
                      </td>
                      <td className="pts-cell">{m.pts}</td>
                      <td>
                        <button className="dk-btn ghost" style={{ padding: '6px 10px', fontSize: 10 }}
                          onClick={(e) => { e.stopPropagation(); openBreakdown(m) }}>
                          Desglose →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ height: 40 }} />

        {/* Desktop drawer */}
        {selected && (
          <div className="dk-drawer">
            <div className="dk-drawer-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avi name={selected.name} color={selected.color} size={40} />
                <div>
                  <div className="t-eyebrow">DESGLOSE · TRANSPARENCIA</div>
                  <div className="t-h2" style={{ fontSize: 20, marginTop: 2 }}>{selected.name}</div>
                </div>
              </div>
              <button className="icon-btn" onClick={() => { setSelected(null); setBreakdownFor(null) }}>
                <GameIcon name="close" size={14} />
              </button>
            </div>
            <div className="dk-drawer-body">
              <BreakdownRows member={selected} rules={scoringRules} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile dialog */}
      <ResponsiveDialog open={!!breakdownFor} onOpenChange={(open) => { if (!open) { setBreakdownFor(null); setSelected(null) } }}>
        <ResponsiveDialogContent showCloseButton={false} className="md:hidden">
          {breakdownFor && (
            <div className="scroll" style={{ overflowY: 'auto', maxHeight: '80dvh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 18px 4px' }}>
                <div className="t-eyebrow">DESGLOSE · TRANSPARENCIA</div>
                <button className="icon-btn" onClick={() => { setBreakdownFor(null); setSelected(null) }} style={{ width: 32, height: 32 }}><GameIcon name="close" size={14} /></button>
              </div>
              <div style={{ padding: '10px 20px 6px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avi name={breakdownFor.name} color={breakdownFor.color} size={48} />
                <div>
                  <div className="t-h2" style={{ fontSize: 22 }}>{breakdownFor.name}</div>
                  <div className="t-meta">RANK #{breakdownFor.rank} · {breakdownFor.handle}</div>
                </div>
              </div>
              <div style={{ padding: '8px 20px 24px' }}>
                <BreakdownRows member={breakdownFor} rules={scoringRules} />
              </div>
            </div>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
