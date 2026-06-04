'use client'

import { useState } from 'react'
import { GameIcon } from '@/components/ui/game-icon'
import { TeamFlag } from '@/components/ui/team-flag'
import { useAppStore } from '@/store/app-store'
import { usePredictionStore } from '@/store/prediction-store'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog'
import type { Match } from '@/types/domain'

interface LockedProps {
  match: Match
  displayPred: [number, number] | undefined
  onClose: () => void
}

function LockedPredictor({ match, displayPred, onClose }: Readonly<LockedProps>) {
  const predLabel = displayPred ? `${displayPred[0]} · ${displayPred[1]}` : 'SIN PREDICCIÓN'
  const lockedMsg = match.state === 'live'
    ? 'El partido está en curso. No puedes agregar ni modificar tu predicción mientras se está jugando.'
    : 'Este partido ya finalizó. Las predicciones se cerraron al inicio del partido.'

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden" style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 18px 4px' }}>
          <div className="t-eyebrow" style={{ color: 'var(--danger)' }}>BLOQUEADA · {match.stage}</div>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}>
            <GameIcon name="close" size={14} />
          </button>
        </div>
        <div style={{ padding: '20px 24px 8px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: 'rgba(255,61,113,0.12)', border: '1px solid rgba(255,61,113,0.3)', display: 'grid', placeItems: 'center' }}>
            <GameIcon name="lock" size={32} color="var(--danger)" />
          </div>
          <div className="t-h2" style={{ fontSize: 26 }}>Predicciones cerradas</div>
          <div className="t-body" style={{ maxWidth: 280 }}>{lockedMsg}</div>
          <div className="card" style={{ marginTop: 8, width: '100%', padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <TeamFlag team={match.home} size="sm" />
            <div style={{ flex: 1 }}>
              <div className="t-meta">TU PREDICCIÓN</div>
              <div className="t-h3" style={{ fontSize: 16 }}>{predLabel}</div>
            </div>
            <TeamFlag team={match.away} size="sm" />
          </div>
        </div>
        <div style={{ padding: '16px 20px 0' }}>
          <button className="btn btn-ghost btn-block" onClick={onClose}>Entendido</button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block" style={{ width: 640, padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div className="t-eyebrow" style={{ color: 'var(--danger)' }}>BLOQUEADA · {match.stage}</div>
            <div className="t-h3" style={{ fontSize: 18, marginTop: 4 }}>{match.home.name} vs {match.away.name}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><GameIcon name="close" size={14} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: 28, background: 'rgba(255,61,113,0.12)', border: '1px solid rgba(255,61,113,0.3)', display: 'grid', placeItems: 'center' }}>
            <GameIcon name="lock" size={36} color="var(--danger)" />
          </div>
          <div className="t-h2" style={{ fontSize: 28 }}>Predicciones cerradas</div>
          <div className="t-body" style={{ maxWidth: 360, fontSize: 14 }}>{lockedMsg}</div>
          <div className="dk-card" style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <TeamFlag team={match.home} size="sm" />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div className="t-meta">TU PREDICCIÓN</div>
              <div className="t-h3" style={{ fontSize: 18, marginTop: 4 }}>{predLabel}</div>
            </div>
            <TeamFlag team={match.away} size="sm" />
          </div>
          <button className="dk-btn ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </>
  )
}

function PredictorInner({ match }: Readonly<{ match: Match }>) {
  const { closePredictor, showToast } = useAppStore()
  const { savePrediction, getPrediction } = usePredictionStore()

  const localPred = getPrediction(match.id)
  const initialPred = localPred ?? match.userPrediction ?? undefined

  const [home, setHome] = useState(initialPred?.[0] ?? 1)
  const [away, setAway] = useState(initialPred?.[1] ?? 1)
  const [submitting, setSubmitting] = useState(false)

  if (match.state !== 'pending') {
    const displayPred = localPred ?? match.userPrediction ?? undefined
    return <LockedPredictor match={match} displayPred={displayPred} onClose={closePredictor} />
  }

  const quickPicks = [
    { label: '1 · 0', h: 1, a: 0 }, { label: '2 · 1', h: 2, a: 1 },
    { label: '1 · 1', h: 1, a: 1 }, { label: '2 · 0', h: 2, a: 0 },
    { label: '0 · 1', h: 0, a: 1 }, { label: '0 · 0', h: 0, a: 0 },
    { label: '3 · 1', h: 3, a: 1 }, { label: '1 · 2', h: 1, a: 2 },
  ]

  let outcome = 'EMPATE'
  let outcomeColor = 'var(--fg-mute)'
  if (home > away) { outcome = `GANA ${match.home.code}`; outcomeColor = match.home.c1 }
  else if (away > home) { outcome = `GANA ${match.away.code}`; outcomeColor = match.away.c1 }

  const outcomeBg = outcomeColor === 'var(--fg-mute)' ? 'rgba(255,255,255,0.05)' : `${outcomeColor}26`

  const submit = async () => {
    setSubmitting(true)
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: match.id, homeScore: home, awayScore: away }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      showToast({ message: data.error ?? 'Error al guardar la predicción', type: 'error' })
      setSubmitting(false)
      return
    }
    savePrediction(match.id, [home, away])
    showToast({ message: `✓ ${match.home.code} ${home}–${away} ${match.away.code} guardado`, type: 'success' })
    closePredictor()
  }

  return (
    <>
      {/* Mobile layout */}
      <div className="md:hidden">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 18px 4px' }}>
          <div className="t-eyebrow">PREDICCIÓN · {match.stage}</div>
          <button className="icon-btn" onClick={closePredictor} style={{ width: 32, height: 32 }}>
            <GameIcon name="close" size={14} />
          </button>
        </div>
        <div style={{ padding: '16px 20px 8px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <TeamFlag team={match.home} size="lg" />
            <div className="t-h3" style={{ fontSize: 16, textAlign: 'center' }}>{match.home.name}</div>
            <div className="score-stepper">
              <div className="num" style={{ color: home > away ? 'var(--signal)' : 'var(--fg)' }}>{home}</div>
              <div className="stepper-controls">
                <button onClick={() => setHome(Math.max(0, home - 1))}>−</button>
                <button onClick={() => setHome(home + 1)}>+</button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div className="t-meta">VS</div>
            <div style={{ padding: '6px 10px', borderRadius: 8, background: outcomeBg, color: outcomeColor, fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {outcome}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <TeamFlag team={match.away} size="lg" />
            <div className="t-h3" style={{ fontSize: 16, textAlign: 'center' }}>{match.away.name}</div>
            <div className="score-stepper">
              <div className="num" style={{ color: away > home ? 'var(--signal)' : 'var(--fg)' }}>{away}</div>
              <div className="stepper-controls">
                <button onClick={() => setAway(Math.max(0, away - 1))}>−</button>
                <button onClick={() => setAway(away + 1)}>+</button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 0 8px' }}>
          <div className="section-head" style={{ padding: '0 20px 8px' }}>
            <div className="num">QUICK PICK</div>
            <div className="title">RESULTADOS COMUNES</div>
          </div>
          <div className="quick-row">
            {quickPicks.map((q) => (
              <button key={q.label} className={`quick-chip ${q.h === home && q.a === away ? 'on' : ''}`}
                onClick={() => { setHome(q.h); setAway(q.a) }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '8px 20px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <GameIcon name="info" size={16} color="var(--warn)" />
            <div className="t-meta" style={{ color: 'var(--fg-dim)', letterSpacing: '0.04em', textTransform: 'none', fontSize: 11 }}>
              <b style={{ color: 'var(--warn)' }}>+5 pts</b> exacto · <b style={{ color: 'var(--signal)' }}>+3</b> diferencia · <b>+1</b> ganador
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 20px 24px' }}>
          <button className="btn btn-primary btn-block" onClick={submit} disabled={submitting}
            style={{ background: submitting ? 'var(--signal-dim)' : undefined }}>
            {submitting ? 'GUARDANDO...' : (<>CONFIRMAR PREDICCIÓN <span className="arrow">→</span></>)}
          </button>
        </div>
      </div>

      {/* Desktop modal */}
      <div className="hidden md:block" style={{ width: 640 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="t-eyebrow">PREDICCIÓN · {match.stage}</div>
            <div className="t-h3" style={{ fontSize: 18, marginTop: 4 }}>{match.home.name} vs {match.away.name}</div>
          </div>
          <button className="icon-btn" onClick={closePredictor}><GameIcon name="close" size={14} /></button>
        </div>

        <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <TeamFlag team={match.home} size="lg" />
            <div className="t-h3" style={{ fontSize: 16, textAlign: 'center' }}>{match.home.name}</div>
            <div className="dk-stepper">
              <div className="num" style={{ color: home > away ? 'var(--signal)' : 'var(--fg)' }}>{home}</div>
              <div className="dk-stepper-row">
                <button onClick={() => setHome(Math.max(0, home - 1))}>−</button>
                <button onClick={() => setHome(home + 1)}>+</button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="t-meta">VS</div>
            <div style={{ padding: '8px 12px', borderRadius: 8, background: outcomeBg, color: outcomeColor, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {outcome}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <TeamFlag team={match.away} size="lg" />
            <div className="t-h3" style={{ fontSize: 16, textAlign: 'center' }}>{match.away.name}</div>
            <div className="dk-stepper">
              <div className="num" style={{ color: away > home ? 'var(--signal)' : 'var(--fg)' }}>{away}</div>
              <div className="dk-stepper-row">
                <button onClick={() => setAway(Math.max(0, away - 1))}>−</button>
                <button onClick={() => setAway(away + 1)}>+</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 28px 16px' }}>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>QUICK PICKS</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quickPicks.map(q => (
              <button key={q.label} className={`quick-chip ${q.h === home && q.a === away ? 'on' : ''}`}
                onClick={() => { setHome(q.h); setAway(q.a) }} style={{ flex: '0 0 auto' }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 28px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="dk-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <GameIcon name="info" size={16} color="var(--warn)" />
            <div className="t-meta" style={{ color: 'var(--fg-dim)', letterSpacing: '0.04em', textTransform: 'none', fontSize: 11 }}>
              <b style={{ color: 'var(--warn)' }}>+5 pts</b> exacto · <b style={{ color: 'var(--signal)' }}>+3</b> diferencia · <b>+1</b> ganador
            </div>
          </div>
          <div className="dk-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderColor: 'rgba(255,214,10,0.3)', background: 'linear-gradient(90deg, rgba(255,214,10,0.06), transparent)' }}>
            <GameIcon name="fire" size={16} color="var(--warn)" />
            <div className="t-meta" style={{ color: 'var(--fg-dim)', letterSpacing: '0.04em', textTransform: 'none', fontSize: 11 }}>
              Racha activa → bonus <b style={{ color: 'var(--warn)' }}>+3 pts</b> si aciertas (máx +5)
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
          <button className="dk-btn ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={closePredictor}>Cancelar</button>
          <button className="dk-btn primary" style={{ flex: 2, justifyContent: 'center', padding: '14px 20px', fontSize: 13 }}
            onClick={submit} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Confirmar predicción →'}
          </button>
        </div>
      </div>
    </>
  )
}

export function PredictorOverlay() {
  const { predictorMatch, closePredictor } = useAppStore()
  return (
    <ResponsiveDialog open={!!predictorMatch} onOpenChange={(open) => { if (!open) closePredictor() }}>
      <ResponsiveDialogContent showCloseButton={false} className="md:max-w-160">
        {predictorMatch && <PredictorInner key={predictorMatch.id} match={predictorMatch} />}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
