import { getLeagueRepository } from '@/repositories'
import { LeaderboardScreen } from './leaderboard-screen'

export default async function LeaderboardPage() {
  const [members, scoringRules] = await Promise.all([
    getLeagueRepository().getLeaderboard('default'),
    getLeagueRepository().getScoringRules('default'),
  ])

  return <LeaderboardScreen members={members} scoringRules={scoringRules} />
}
