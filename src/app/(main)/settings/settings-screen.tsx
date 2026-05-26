'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import type { Member, ScoringRules } from '@/types/domain'

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
      <div style={{ flex: 1 }}>
        <div className="t-h3" style={{ fontSize: 14 }}>{label}</div>
        {desc && <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em' }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{ width: 40, height: 24, borderRadius: 12, border: 0, padding: 2, background: value ? 'var(--signal)' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.15s', cursor: 'pointer' }}
      >
        <div style={{ width: 20, height: 20, borderRadius: 10, background: '#fff', transform: `translateX(${value ? 16 : 0}px)`, transition: 'transform 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </button>
    </div>
  )
}

interface SettingsScreenProps {
  members: Member[]
  scoringRules: ScoringRules
}

export function SettingsScreen({ members, scoringRules }: SettingsScreenProps) {
  const [tab, setTab] = useState('info')
  const [strict, setStrict] = useState(true)
  const [bonusCombo, setBonusCombo] = useState(true)
  const [closeBeforeKickoff, setCloseBeforeKickoff] = useState(15)
  const R = scoringRules

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/profile" className="icon-btn"><GameIcon name="back" /></Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">AJUSTES</div>
          <div className="topbar-title">LIGA</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn"><GameIcon name="share" size={16} /></button>
        </div>
      </div>

      <div className="scroll">
        <div style={{ padding: '12px 20px 0' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(0,210,106,0.10), transparent 70%)' }}>
            <div className="t-eyebrow">LIGA</div>
            <div className="t-h2" style={{ fontSize: 32, marginTop: 4 }}>AMIGOS DEL BAR</div>
            <div className="t-meta" style={{ marginTop: 6 }}>12 MIEMBROS · CREADA 11 MAY · POR @TANIA</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '12px 14px', fontSize: 12 }}>COMPARTIR · POLLA-FB7K</button>
              <button className="btn btn-ghost" style={{ padding: '12px 14px', fontSize: 12 }}><GameIcon name="share" size={14} /></button>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px 0', display: 'flex', gap: 6 }}>
          {[{ id: 'info', label: 'Info' }, { id: 'rules', label: 'Reglas' }, { id: 'members', label: 'Miembros' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: tab === t.id ? 'var(--fg)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#04130A' : 'var(--fg-dim)', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div style={{ paddingTop: 16 }}>
            <div style={{ marginBottom: 18 }}>
              <div className="section-head">
                <div className="num">A · DESCRIPCIÓN</div>
                <div className="title">LA LIGA</div>
              </div>
              <div style={{ padding: '0 20px' }}>
                <div className="card t-body">Liga creada para seguir el Mundial 2026 con los amigos del bar de los miércoles. Predice todos los partidos de fase de grupos y completa tu Bracket Oracle antes del 11 de junio para sumar puntos extras.</div>
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div className="section-head">
                <div className="num">B · STATS</div>
                <div className="title">ESTADO DE LIGA</div>
              </div>
              <div style={{ padding: '0 20px' }}>
                <div className="kpi">
                  <div><span className="label">PARTIDOS</span><span className="value">28<span className="small">/104</span></span></div>
                  <div><span className="label">MIEMBROS</span><span className="value">{members.length}</span></div>
                  <div><span className="label">PROM PTS</span><span className="value">213</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'rules' && (
          <div style={{ paddingTop: 16 }}>
            <div style={{ marginBottom: 18 }}>
              <div className="section-head">
                <div className="num">A · PUNTAJE</div>
                <div className="title">CRITERIOS DE ACIERTO</div>
              </div>
              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Resultado exacto', `+${R.exact}`, 'Marcador idéntico'],
                  ['Diferencia de gol', `+${R.diff}`, 'Mismo ganador, mismo margen'],
                  ['Solo ganador / empate', `+${R.winner}`, 'Acierta el resultado'],
                  ['Bonus por racha', '+1×N', '+1 pt por nivel de racha (máx +5)'],
                  [`Pleno de jornada (5/5)`, `+${R.combo}`, 'Bonus combo'],
                  ['Pick final · campeón', `+${R.oracleChampion}`, 'Bracket Oracle'],
                ].map(([k, v, d]) => (
                  <div key={k} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 56, padding: '6px 10px', textAlign: 'center', background: v === `+${R.oracleChampion}` ? 'var(--warn)' : v === `+${R.combo}` ? 'var(--signal)' : 'rgba(255,255,255,0.05)', color: v === `+${R.oracleChampion}` ? '#1A1400' : v === `+${R.combo}` ? '#04130A' : 'var(--fg)', borderRadius: 8, fontFamily: 'var(--display)', fontWeight: 900, fontSize: 14, letterSpacing: '-0.02em' }}>{v}</div>
                    <div style={{ flex: 1 }}>
                      <div className="t-h3" style={{ fontSize: 14 }}>{k}</div>
                      <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em' }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div className="section-head">
                <div className="num">B · TIMING</div>
                <div className="title">CIERRE DE PREDICCIONES</div>
              </div>
              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="t-h3" style={{ fontSize: 14 }}>Cierra {closeBeforeKickoff} min antes</div>
                      <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em' }}>Tiempo de gracia antes del kickoff</div>
                    </div>
                    <div className="t-num" style={{ fontSize: 28, color: 'var(--signal)' }}>{closeBeforeKickoff}&apos;</div>
                  </div>
                  <input type="range" min="0" max="60" step="5" value={closeBeforeKickoff} onChange={(e) => setCloseBeforeKickoff(+e.target.value)} style={{ width: '100%', accentColor: 'var(--signal)' }} />
                </div>
                <Toggle label="Modo estricto" desc="Sin ediciones después del kickoff" value={strict} onChange={setStrict} />
                <Toggle label="Bonus combo" desc="+10 al acertar 5/5 una jornada" value={bonusCombo} onChange={setBonusCombo} />
              </div>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div style={{ paddingTop: 16 }}>
            {members.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--line)' }}>
                <Avi name={m.name} color={m.color} size={36} />
                <div style={{ flex: 1 }}>
                  <div className="t-h3" style={{ fontSize: 14 }}>{m.name}</div>
                  <div className="t-meta">{m.handle}{i === 0 && ' · ADMIN'}</div>
                </div>
                <div className="t-num" style={{ fontSize: 14, color: 'var(--fg-dim)' }}>{m.pts}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 100 }} />
      </div>
    </div>
  )
}
