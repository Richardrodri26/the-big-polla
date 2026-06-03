'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'form' | 'done'

interface CreatedLeague {
  id: string
  name: string
  inviteUrl: string
  inviteToken: string
}

export function CreateScreen() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedLeague | null>(null)
  const [copied, setCopied] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 10,
    color: 'var(--fg)',
    fontFamily: 'var(--font-inter, sans-serif)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const leagueRes = await fetch('/api/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type: 'PRIVATE' }),
    })

    const leagueData = await leagueRes.json()

    if (!leagueRes.ok) {
      setError(leagueData.error ?? 'Error al crear la liga')
      setLoading(false)
      return
    }

    const inviteRes = await fetch(`/api/leagues/${leagueData.league.id}/invites`, {
      method: 'POST',
    })

    const inviteData = await inviteRes.json()

    if (!inviteRes.ok) {
      setError(inviteData.error ?? 'Liga creada pero no se pudo generar el link de invitación')
      setLoading(false)
      return
    }

    setCreated({
      id: leagueData.league.id,
      name: leagueData.league.name,
      inviteUrl: inviteData.url,
      inviteToken: inviteData.invite.token,
    })
    setStep('done')
    setLoading(false)
  }

  async function handleCopy() {
    if (!created) return
    await navigator.clipboard.writeText(created.inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'done' && created) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{
          fontFamily: 'var(--font-inter, sans-serif)',
          fontWeight: 900,
          fontSize: 28,
          letterSpacing: '-0.04em',
          marginBottom: 8,
        }}>
          {created.name.toUpperCase()}
        </h1>
        <p className="t-meta" style={{ marginBottom: 28, textTransform: 'none', fontSize: 13, color: 'var(--fg-muted)' }}>
          Liga creada. Compartí el link para que otros se unan.
        </p>

        <div style={{ marginBottom: 24 }}>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>
            CÓDIGO DE INVITACIÓN
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              readOnly
              value={created.inviteToken}
              style={{ ...inputStyle, flex: 1, cursor: 'default', letterSpacing: '0.1em', fontWeight: 700 }}
            />
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '12px 16px',
                background: copied ? 'var(--signal)' : 'var(--surface)',
                border: `1px solid ${copied ? 'var(--signal)' : 'var(--line)'}`,
                borderRadius: 10,
                color: copied ? '#000' : 'var(--fg)',
                fontFamily: 'var(--font-inter, sans-serif)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
              }}
            >
              {copied ? '✓ COPIADO' : 'COPIAR LINK'}
            </button>
          </div>
        </div>

        <div style={{
          padding: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          marginBottom: 28,
        }}>
          <p className="t-eyebrow" style={{ marginBottom: 12 }}>PUNTUACIÓN</p>
          {[
            ['Resultado exacto', '5 pts'],
            ['Ganador + diferencia', '3 pts'],
            ['Solo ganador', '1 pt'],
            ['Bonus racha (3+)', '+1 pt'],
          ].map(([label, pts]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="t-meta" style={{ textTransform: 'none', fontSize: 12, color: 'var(--fg-muted)' }}>
                {label}
              </span>
              <span className="t-meta" style={{ fontSize: 12, color: 'var(--signal)', fontWeight: 700 }}>
                {pts}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => router.push(`/leagues/${created.id}`)}
          className="btn btn-primary btn-block"
        >
          Ir a mi liga →
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{
        fontFamily: 'var(--font-inter, sans-serif)',
        fontWeight: 900,
        fontSize: 28,
        letterSpacing: '-0.04em',
        marginBottom: 8,
      }}>
        CREAR POLLA
      </h1>
      <p className="t-meta" style={{ marginBottom: 28, textTransform: 'none', fontSize: 13, color: 'var(--fg-muted)' }}>
        Creá tu liga privada e invitá a tus amigos.
      </p>

      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>
            NOMBRE DE LA POLLA
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            minLength={3}
            maxLength={40}
            placeholder="Ej: Los cracks del Mundial"
            style={inputStyle}
            autoFocus
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,61,113,0.1)', border: '1px solid rgba(255,61,113,0.3)', borderRadius: 8 }}>
            <span className="t-meta" style={{ color: 'var(--danger)', textTransform: 'none', fontSize: 12 }}>
              {error}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || name.trim().length < 3}
          className="btn btn-primary btn-block"
          style={{ marginTop: 8 }}
        >
          {loading ? 'Creando…' : 'Crear y obtener código →'}
        </button>
      </form>
    </div>
  )
}
