'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { League } from '@/types/domain'

interface BrowseScreenProps {
  initialLeagues: League[]
  initialTotal: number
}

export function BrowseScreen({ initialLeagues, initialTotal }: BrowseScreenProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [leagues, setLeagues] = useState(initialLeagues)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchLeagues(q: string, p: number, append = false) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (q) params.set('search', q)
    const res = await fetch(`/api/leagues/directory?${params}`)
    const data = await res.json()
    setLeagues(prev => append ? [...prev, ...data.leagues] : data.leagues)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchLeagues(search, 1)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  async function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    await fetchLeagues(search, nextPage, true)
  }

  async function handleJoin(leagueId: string) {
    setJoiningId(leagueId)
    await fetch(`/api/leagues/${leagueId}/join`, { method: 'POST' })
    setJoiningId(null)
    router.push(`/leagues/${leagueId}`)
  }

  const hasMore = leagues.length < total

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ width: 36 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">LIGAS PÚBLICAS</div>
          <div className="topbar-title">DIRECTORIO</div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '12px 20px' }}>
        <input
          type="text"
          placeholder="Buscar liga..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--line)',
            color: 'var(--fg)', fontFamily: 'var(--font-inter, sans-serif)',
            fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0 20px' }}>
          <div className="t-meta" style={{ marginBottom: 12 }}>{total} ligas encontradas</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leagues.map(league => (
              <div key={league.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 800, fontSize: 15 }}>
                    {league.name}
                  </div>
                  <div className="t-meta" style={{ marginTop: 2 }}>{league.memberCount} miembros</div>
                </div>
                <button
                  onClick={() => handleJoin(league.id)}
                  disabled={joiningId === league.id}
                  style={{
                    padding: '8px 16px', borderRadius: 8, background: 'var(--fg)', color: '#04130A',
                    border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {joiningId === league.id ? '...' : 'UNIRSE'}
                </button>
              </div>
            ))}

            {leagues.length === 0 && !loading && (
              <p style={{ color: 'var(--fg-mute)', textAlign: 'center', padding: 40 }}>
                No se encontraron ligas públicas.
              </p>
            )}
          </div>

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', marginTop: 16, borderRadius: 10,
                background: 'transparent', border: '1px solid var(--line)',
                color: 'var(--fg-dim)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              {loading ? 'Cargando...' : 'VER MÁS'}
            </button>
          )}
        </div>
        <div style={{ height: 90 }} />
      </div>
    </div>
  )
}
