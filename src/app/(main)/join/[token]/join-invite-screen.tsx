'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
  leagueName: string
  memberCount: number
}

export function JoinInviteScreen({ token, leagueName, memberCount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/invites/${token}/join`, { method: 'POST' })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al unirse')
      setLoading(false)
      return
    }
    router.push(`/leagues/${data.leagueId}`)
  }

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <div className="t-eyebrow" style={{ marginBottom: 8 }}>INVITACIÓN A LIGA</div>
      <h1 style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 32, letterSpacing: '-0.04em', margin: '0 0 8px' }}>
        {leagueName.toUpperCase()}
      </h1>
      <p className="t-meta" style={{ marginBottom: 32 }}>{memberCount} miembros activos</p>

      {error && (
        <p style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 14 }}>{error}</p>
      )}

      <button
        onClick={handleJoin}
        disabled={loading}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 10,
          background: 'var(--fg)', color: '#04130A', border: 'none',
          fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900,
          fontSize: 16, letterSpacing: '-0.01em', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Uniéndote...' : 'UNIRME A LA LIGA →'}
      </button>
    </div>
  )
}
