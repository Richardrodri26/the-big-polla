import { getLeagueRepository } from '@/repositories'
import { LeaderboardClient } from './leaderboard-client'

const LEAGUE_ID = 'default'

export default async function LeaderboardPage() {
  const [members, scoringRules] = await Promise.all([
    getLeagueRepository().getLeaderboard(LEAGUE_ID),
    getLeagueRepository().getScoringRules(LEAGUE_ID),
  ])

  return (
    <LeaderboardClient
      leagueId={LEAGUE_ID}
      initialMembers={members}
      scoringRules={scoringRules}
    />
  )
}
