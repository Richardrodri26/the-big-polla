import Link from 'next/link'
import type { League } from '@/types/domain'

interface Props {
  leagues: League[]
}

export function LeaguesScreen({ leagues }: Props) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{
          fontFamily: 'var(--font-inter, sans-serif)',
          fontWeight: 900,
          fontSize: 28,
          letterSpacing: '-0.04em',
          margin: 0,
        }}>
          MIS LIGAS
        </h1>
        <Link href="/leagues/create" style={{
          padding: '8px 16px',
          background: 'var(--signal)',
          color: '#000',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.06em',
          textDecoration: 'none',
        }}>
          + CREAR
        </Link>
      </div>

      <Link
        href="/leagues/browse"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 16px', borderRadius: 10, marginBottom: 24,
          border: '1px solid var(--line)', color: 'var(--fg-dim)',
          fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 700,
          fontSize: 13, textDecoration: 'none',
        }}
      >
        🌐 Explorar ligas públicas
      </Link>

      {leagues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: 'var(--fg-muted)', marginBottom: 16 }}>
            No estás en ninguna liga todavía.
          </p>
          <Link href="/leagues/create" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'var(--signal)',
            color: '#000',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}>
            Crear mi primera liga →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leagues.map(league => (
            <Link key={league.id} href={`/leagues/${league.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '14px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--fg)' }}>
                    {league.name}
                  </div>
                  <div className="t-meta" style={{ textTransform: 'none', fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
                    {league.type === 'PRIVATE' ? '🔒' : '🌐'} {league.memberCount ?? 0} miembros
                  </div>
                </div>
                <span style={{ color: 'var(--fg-muted)', fontSize: 18 }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
