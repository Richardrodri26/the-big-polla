'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { League, LeagueRequest, Member, ScoringRules } from '@/types/domain'

interface Props {
  league: League
  members: Member[]
  rules: ScoringRules
  pendingRequests: LeagueRequest[]
  isOwner: boolean
  currentUserId: string
}

export function LeagueDetailScreen({ league, members, pendingRequests, isOwner }: Props) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  async function handleRequest(requestId: string, action: 'approve' | 'reject') {
    setProcessingId(requestId)
    await fetch(`/api/leagues/${league.id}/requests/${requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setProcessingId(null)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <div className="t-eyebrow" style={{ marginBottom: 4, color: 'var(--fg-muted)' }}>
          {league.type === 'PRIVATE' ? '🔒 PRIVADA' : '🌐 PÚBLICA'} · {league.memberCount} miembros
        </div>
        <h1 style={{
          fontFamily: 'var(--font-inter, sans-serif)',
          fontWeight: 900,
          fontSize: 28,
          letterSpacing: '-0.04em',
          margin: 0,
        }}>
          {league.name.toUpperCase()}
        </h1>
      </div>

      {/* Solicitudes pendientes — solo visible para el owner */}
      {isOwner && pendingRequests.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="t-eyebrow" style={{ marginBottom: 12 }}>
            SOLICITUDES PENDIENTES ({pendingRequests.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingRequests.map(req => (
              <div key={req.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 10,
              }}>
                <span style={{ fontSize: 14 }}>{req.userId}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleRequest(req.id, 'approve')}
                    disabled={processingId === req.id}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--signal)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => handleRequest(req.id, 'reject')}
                    disabled={processingId === req.id}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: 'var(--danger)',
                      border: '1px solid var(--danger)',
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ✗ Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="t-eyebrow" style={{ marginBottom: 12 }}>RANKING</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {members.map((member, i) => (
          <div key={member.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: member.me ? 'rgba(0, 210, 106, 0.08)' : 'var(--surface)',
            border: `1px solid ${member.me ? 'var(--signal)' : 'var(--line)'}`,
            borderRadius: 10,
          }}>
            <span style={{ fontWeight: 900, fontSize: 18, width: 24, textAlign: 'center' }}>
              {i + 1}
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: member.color, flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{member.name}</div>
              <div className="t-meta" style={{ textTransform: 'none', fontSize: 11, color: 'var(--fg-muted)' }}>
                @{member.handle}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{member.pts}</div>
              <div className="t-meta" style={{ textTransform: 'none', fontSize: 10, color: 'var(--fg-muted)' }}>pts</div>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p style={{ color: 'var(--fg-muted)', textAlign: 'center', padding: 24 }}>
            Aún no hay miembros con puntos.
          </p>
        )}
      </div>
    </div>
  )
}
