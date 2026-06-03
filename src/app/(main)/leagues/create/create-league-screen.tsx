'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreateLeagueScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al crear la liga')
      setLoading(false)
      return
    }

    router.push(`/leagues/${data.league.id}`)
  }

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

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{
        fontFamily: 'var(--font-inter, sans-serif)',
        fontWeight: 900,
        fontSize: 28,
        letterSpacing: '-0.04em',
        marginBottom: 24,
      }}>
        CREAR LIGA
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>
            NOMBRE
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            minLength={3}
            maxLength={40}
            placeholder="Ej: Los Cracks del Mundial"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
            TIPO
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['PRIVATE', 'PUBLIC'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: type === t ? 'var(--signal)' : 'var(--surface)',
                  color: type === t ? '#000' : 'var(--fg)',
                  border: `1px solid ${type === t ? 'var(--signal)' : 'var(--line)'}`,
                  borderRadius: 10,
                  fontFamily: 'var(--font-inter, sans-serif)',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                {t === 'PRIVATE' ? '🔒 PRIVADA' : '🌐 PÚBLICA'}
              </button>
            ))}
          </div>
          <p className="t-meta" style={{ marginTop: 8, textTransform: 'none', fontSize: 12, color: 'var(--fg-muted)' }}>
            {type === 'PRIVATE'
              ? 'Los usuarios necesitan tu aprobación para unirse.'
              : 'Cualquiera puede unirse directamente.'}
          </p>
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
          disabled={loading}
          className="btn btn-primary btn-block"
          style={{ marginTop: 8 }}
        >
          {loading ? 'Creando…' : 'Crear liga →'}
        </button>
      </form>
    </div>
  )
}
