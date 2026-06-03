'use client'

import { useLeaderboardPolling } from '@/hooks/use-leaderboard-polling'
import { LeaderboardScreen } from './leaderboard-screen'
import type { Member, ScoringRules } from '@/types/domain'

interface Props {
  leagueId: string
  initialMembers: Member[]
  scoringRules: ScoringRules
}

export function LeaderboardClient({ leagueId, initialMembers, scoringRules }: Props) {
  const { members, updatedAt, loading } = useLeaderboardPolling(leagueId)

  const displayMembers = members.length > 0 ? members : initialMembers

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {loading && members.length === 0 && (
        <div style={{ position: 'absolute', top: 8, right: 16, fontSize: 10, color: 'var(--fg-mute)', zIndex: 10 }}>
          Actualizando...
        </div>
      )}
      {updatedAt && (
        <div style={{ position: 'absolute', top: 8, right: 16, fontSize: 9, color: 'var(--fg-faint)', fontFamily: 'var(--font-jetbrains, monospace)', letterSpacing: '0.06em', zIndex: 10 }}>
          ACT. {new Date(updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <LeaderboardScreen members={displayMembers} scoringRules={scoringRules} />
    </div>
  )
}
