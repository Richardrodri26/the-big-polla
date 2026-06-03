'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import { DKTopbar } from '@/components/layout/dk-topbar'
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

function DKToggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="dk-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div className="t-h3" style={{ fontSize: 15 }}>{label}</div>
        {desc && <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em' }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{ width: 44, height: 26, borderRadius: 13, border: 0, padding: 3, background: value ? 'var(--signal)' : 'rgba(255,255,255,0.1)', transition: 'background 0.15s', cursor: 'pointer' }}
      >
        <div style={{ width: 20, height: 20, borderRadius: 10, background: '#fff', transform: `translateX(${value ? 18 : 0}px)`, transition: 'transform 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </button>
    </div>
  )
}

const SETTINGS_TABS = [
  { id: 'info', label: 'Información' },
  { id: 'rules', label: 'Reglas de puntaje' },
  { id: 'timing', label: 'Tiempos de cierre' },
  { id: 'members', label: 'Miembros' },
  { id: 'danger', label: 'Peligro · zona admin' },
]

interface SettingsScreenProps {
  members: Member[]
  scoringRules: ScoringRules
  league: {
    name: string
    ownerHandle: string
    createdAt: string        // ISO 8601
    inviteToken: string | null
  }
  totalMatches: number
  finalMatches: number
}

export function SettingsScreen({ members, scoringRules, league, totalMatches, finalMatches }: SettingsScreenProps) {
  const [tab, setTab] = useState('info')
  const [strict, setStrict] = useState(true)
  const [bonusCombo, setBonusCombo] = useState(true)
  const [closeBeforeKickoff, setCloseBeforeKickoff] = useState(15)
  const R = scoringRules

  const avgPts =
    members.length > 0
      ? Math.round(members.reduce((s, m) => s + m.pts, 0) / members.length)
      : 0

  const avgHitPct =
    finalMatches > 0 && members.length > 0
      ? Math.round(
          (members.reduce((s, m) => s + m.hits, 0) / members.length / finalMatches) * 100,
        )
      : 0

  const createdShort = new Date(league.createdAt)
    .toLocaleDateString('es', { day: 'numeric', month: 'short' })
    .toUpperCase()   // e.g. "11 MAY"

  const createdFull = new Date(league.createdAt)
    .toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase()   // e.g. "11 MAY 2026"

  const RulesContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        ['Resultado exacto', `+${R.exact}`, 'Marcador idéntico', 'var(--warn)'],
        ['Diferencia de gol', `+${R.diff}`, 'Mismo ganador, mismo margen', 'var(--signal)'],
        ['Solo ganador / empate', `+${R.winner}`, 'Acierta el resultado', 'var(--fg)'],
        ['Bonus por racha', '+1×N', '+1 pt por nivel de racha (máx +5)', 'var(--warn)'],
        [`Pleno de jornada (5/5)`, `+${R.combo}`, 'Bonus combo', 'var(--signal)'],
        ['Pick final · campeón', `+${R.oracleChampion}`, 'Bracket Oracle', 'var(--warn)'],
      ].map(([k, v, d, c]) => (
        <div key={String(k)} className="dk-card hidden md:flex" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 72, padding: '10px 12px', textAlign: 'center', background: String(c) === 'var(--warn)' ? 'rgba(255,214,10,0.18)' : 'rgba(0,210,106,0.18)', color: String(c), borderRadius: 10, fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 22, letterSpacing: '-0.03em' }}>{v}</div>
          <div style={{ flex: 1 }}>
            <div className="t-h3" style={{ fontSize: 15 }}>{k}</div>
            <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em' }}>{d}</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,210,106,0.15)', color: 'var(--signal)', fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 10, letterSpacing: '0.12em' }}>
            ● ACTIVA
          </span>
        </div>
      ))}
      {/* Mobile version */}
      <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['Resultado exacto', `+${R.exact}`, 'Marcador idéntico'],
          ['Diferencia de gol', `+${R.diff}`, 'Mismo ganador, mismo margen'],
          ['Solo ganador / empate', `+${R.winner}`, 'Acierta el resultado'],
          ['Bonus por racha', '+1×N', '+1 pt por nivel de racha (máx +5)'],
          [`Pleno de jornada (5/5)`, `+${R.combo}`, 'Bonus combo'],
          ['Pick final · campeón', `+${R.oracleChampion}`, 'Bracket Oracle'],
        ].map(([k, v, d]) => (
          <div key={String(k)} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, padding: '6px 10px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', color: 'var(--fg)', borderRadius: 8, fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 14, letterSpacing: '-0.02em' }}>{v}</div>
            <div style={{ flex: 1 }}>
              <div className="t-h3" style={{ fontSize: 14 }}>{k}</div>
              <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em' }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const TimingContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="dk-card hidden md:block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div className="t-h3" style={{ fontSize: 15 }}>Cierra {closeBeforeKickoff} min antes del kickoff</div>
            <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em' }}>Tiempo de gracia para bloqueo de predicciones</div>
          </div>
          <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 44, letterSpacing: '-0.05em', color: 'var(--signal)', fontVariationSettings: '"wdth" 75' }}>{closeBeforeKickoff}&apos;</div>
        </div>
        <input type="range" min="0" max="60" step="5" value={closeBeforeKickoff} onChange={(e) => setCloseBeforeKickoff(+e.target.value)} style={{ width: '100%', accentColor: 'var(--signal)', marginTop: 14 }} />
      </div>
      <DKToggle label="Modo estricto" desc="Las predicciones no se pueden modificar después del kickoff, sin excepción" value={strict} onChange={setStrict} />
      <DKToggle label="Bloqueo automático durante partidos en vivo" desc="Recomendado · evita inconsistencias y disputas" value={true} onChange={() => {}} />
      <DKToggle label="Notificar 30 min antes del cierre" desc="A todos los miembros sin predicción" value={true} onChange={() => {}} />
    </div>
  )

  const InfoContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="dk-card">
        <div className="t-eyebrow">DESCRIPCIÓN</div>
        <div className="t-body" style={{ marginTop: 8 }}>
          Liga creada para seguir el Mundial 2026 con los amigos del bar de los miércoles. Predice todos los partidos de fase de grupos y completa tu Bracket Oracle antes del 11 de junio para sumar puntos extras.
        </div>
      </div>
      <div className="dk-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow">CÓDIGO DE INVITACIÓN</div>
          <div className="t-h2" style={{ fontSize: 34, marginTop: 4, letterSpacing: '0.06em' }}>{league.inviteToken?.toUpperCase() ?? '—'}</div>
        </div>
        <button className="dk-btn ghost"><GameIcon name="share" size={14} /> Copiar</button>
      </div>
      <div className="dk-kpi-big">
        <div><span className="label">PARTIDOS</span><span className="value">{finalMatches}<span className="small">/{totalMatches}</span></span></div>
        <div><span className="label">MIEMBROS</span><span className="value">{members.length}</span></div>
        <div><span className="label">PROM PTS</span><span className="value">{avgPts}</span></div>
        <div><span className="label">% HIT LIGA</span><span className="value">{avgHitPct}<span className="small">%</span></span></div>
      </div>
    </div>
  )

  const MembersContent = () => (
    <div className="dk-card" style={{ padding: 0 }}>
      <div className="dk-members-list" style={{ padding: '0 22px' }}>
        {members.map((m, i) => (
          <div key={m.id} className="dk-member-row">
            <Avi name={m.name} color={m.color} size={36} />
            <div>
              <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em' }}>
                {m.name}
                {i === 0 && <span style={{ color: 'var(--signal)', marginLeft: 8, fontSize: 9, letterSpacing: '0.12em', fontFamily: 'var(--font-jetbrains, monospace)' }}>ADMIN</span>}
              </div>
              <div className="t-meta">{m.handle}</div>
            </div>
            <div className="t-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>RANK #{m.rank}</div>
            <button className="dk-btn ghost" style={{ padding: '6px 12px', fontSize: 10 }}>Ver →</button>
          </div>
        ))}
      </div>
    </div>
  )

  const DangerContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="dk-card" style={{ borderColor: 'rgba(255,61,113,0.3)' }}>
        <div className="t-eyebrow" style={{ color: 'var(--danger)' }}>ZONA DE PELIGRO</div>
        <div className="t-h3" style={{ fontSize: 18, marginTop: 4 }}>Cerrar liga</div>
        <div className="t-body" style={{ marginTop: 6 }}>Una vez cerrada, no se pueden editar predicciones y se congela el ranking final.</div>
        <button className="dk-btn danger" style={{ marginTop: 14 }}>Cerrar liga al fin del Mundial</button>
      </div>
      <div className="dk-card" style={{ borderColor: 'rgba(255,61,113,0.3)' }}>
        <div className="t-h3" style={{ fontSize: 18 }}>Eliminar liga</div>
        <div className="t-body" style={{ marginTop: 6 }}>Acción irreversible. Se perderán predicciones, ranking, badges.</div>
        <button className="dk-btn danger" style={{ marginTop: 14 }}>Eliminar liga permanentemente</button>
      </div>
    </div>
  )

  const activeContent = {
    info: <InfoContent />,
    rules: <RulesContent />,
    timing: <TimingContent />,
    members: <MembersContent />,
    danger: <DangerContent />,
  }[tab]

  return (
    <div className="screen screen-anim">
      {/* Mobile topbar */}
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

      {/* Desktop topbar */}
      <DKTopbar crumbs={[`LIGA ${league.name}`, 'AJUSTES']} />

      {/* Desktop page header */}
      <div className="dk-page-head">
        <div>
          <div className="sub">{`${members.length} MIEMBROS · CREADA POR @${league.ownerHandle} · ${createdFull}`}</div>
          <div className="title">AJUSTES</div>
        </div>
        <div className="actions">
          <button className="dk-btn ghost"><GameIcon name="share" size={14} /> Compartir liga</button>
          <button className="dk-btn primary">Guardar cambios →</button>
        </div>
      </div>

      <div className="scroll">
        {/* Mobile content */}
        <div className="md:hidden">
          <div style={{ padding: '12px 20px 0' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(0,210,106,0.10), transparent 70%)' }}>
              <div className="t-eyebrow">LIGA</div>
              <div className="t-h2" style={{ fontSize: 32, marginTop: 4 }}>{league.name}</div>
              <div className="t-meta" style={{ marginTop: 6 }}>{`${members.length} MIEMBROS · CREADA ${createdShort} · POR @${league.ownerHandle}`}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: '12px 14px', fontSize: 12 }}>{`COMPARTIR${league.inviteToken ? ` · ${league.inviteToken.slice(0, 8).toUpperCase()}` : ''}`}</button>
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
              <div className="section-head"><div className="num">A · DESCRIPCIÓN</div><div className="title">LA LIGA</div></div>
              <div style={{ padding: '0 20px 16px' }}><div className="card t-body">Liga creada para seguir el Mundial 2026 con los amigos del bar de los miércoles.</div></div>
              <div className="section-head"><div className="num">B · STATS</div><div className="title">ESTADO DE LIGA</div></div>
              <div style={{ padding: '0 20px 16px' }}>
                <div className="kpi">
                  <div><span className="label">PARTIDOS</span><span className="value">{finalMatches}<span className="small">/{totalMatches}</span></span></div>
                  <div><span className="label">MIEMBROS</span><span className="value">{members.length}</span></div>
                  <div><span className="label">PROM PTS</span><span className="value">{avgPts}</span></div>
                </div>
              </div>
            </div>
          )}
          {tab === 'rules' && (
            <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Resultado exacto', `+${R.exact}`, 'Marcador idéntico'],
                ['Diferencia de gol', `+${R.diff}`, 'Mismo ganador, mismo margen'],
                ['Solo ganador / empate', `+${R.winner}`, 'Acierta el resultado'],
                ['Bonus por racha', '+1×N', '+1 pt por nivel de racha (máx +5)'],
                [`Pleno (5/5)`, `+${R.combo}`, 'Bonus combo'],
                ['Campeón Oracle', `+${R.oracleChampion}`, 'Bracket Oracle'],
              ].map(([k, v, d]) => (
                <div key={String(k)} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 56, padding: '6px 10px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', color: 'var(--fg)', borderRadius: 8, fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 14 }}>{v}</div>
                  <div style={{ flex: 1 }}>
                    <div className="t-h3" style={{ fontSize: 14 }}>{k}</div>
                    <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em' }}>{d}</div>
                  </div>
                </div>
              ))}
              <Toggle label="Modo estricto" desc="Sin ediciones después del kickoff" value={strict} onChange={setStrict} />
              <Toggle label="Bonus combo" desc="+10 al acertar 5/5 una jornada" value={bonusCombo} onChange={setBonusCombo} />
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
        </div>

        {/* Desktop 2-col */}
        <div className="dk-section hidden md:block">
          <div className="dk-settings-grid">
            <div className="dk-settings-side">
              {SETTINGS_TABS.map((it) => (
                <button key={it.id} className={tab === it.id ? 'active' : ''} onClick={() => setTab(it.id)}>
                  {it.label}
                </button>
              ))}
            </div>
            <div>{activeContent}</div>
          </div>
        </div>

        <div style={{ height: 100 }} />
      </div>
    </div>
  )
}
