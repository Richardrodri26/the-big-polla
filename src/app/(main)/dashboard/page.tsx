import { getLeagueRepository, getMatchRepository } from '@/repositories'
import { DashboardScreen } from './dashboard-screen'

export default async function DashboardPage() {
  const [matches, members] = await Promise.all([
    getMatchRepository().getMatches(),
    getLeagueRepository().getMembers('default'),
  ])
  return <DashboardScreen matches={matches} members={members} />
}
