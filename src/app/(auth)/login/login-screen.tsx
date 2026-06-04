'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'

export function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn.email({ email, password, callbackURL: '/feed' })
    if (err) {
      setError(err.message ?? 'Error al iniciar sesión')
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
        }}>INICIAR SESIÓN</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            placeholder="••••••••"
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
          {loading ? 'Entrando…' : 'Entrar →'}
        </button>
      </form>

      <p className="t-meta" style={{ marginTop: 20, textAlign: 'center', textTransform: 'none', letterSpacing: '0.02em' }}>
        ¿No tienes cuenta?{' '}
        <Link href="/register" style={{ color: 'var(--signal)', fontWeight: 700 }}>Regístrate</Link>
      </p>
    </div>
  )
}
