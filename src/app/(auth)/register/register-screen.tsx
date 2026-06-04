'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth-client'

export function RegisterScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (signUp.email as any)({
      name,
      email,
      password,
      handle,
      callbackURL: '/feed',
    })
    if (err) {
      setError(err.message ?? 'Error al registrarse')
      setLoading(false)
    } else {
      router.push('/feed')
    }
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
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>THE BIG POLLA</div>
        <h1 style={{
          fontFamily: 'var(--font-inter, sans-serif)',
          fontWeight: 900,
          fontSize: 36,
          letterSpacing: '-0.05em',
          fontVariationSettings: '"wdth" 75',
          margin: 0,
        }}>REGISTRARSE</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>NOMBRE</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Tu nombre"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>HANDLE</label>
          <input
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            required
            placeholder="tu_handle"
            style={{ ...inputStyle, fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 13 }}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="vos@ejemplo.com"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>CONTRASEÑA</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255,61,113,0.1)',
            border: '1px solid rgba(255,61,113,0.3)',
            borderRadius: 8,
          }}>
            <span className="t-meta" style={{ color: 'var(--danger)', textTransform: 'none', fontSize: 12 }}>
              {error}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-block"
          style={{ marginTop: 6 }}
        >
          {loading ? 'Registrando…' : 'Crear cuenta →'}
        </button>
      </form>

      <p className="t-meta" style={{ marginTop: 20, textAlign: 'center', textTransform: 'none', letterSpacing: '0.02em' }}>
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" style={{ color: 'var(--signal)', fontWeight: 700 }}>Inicia sesión</Link>
      </p>
    </div>
  )
}
