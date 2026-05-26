import { getLeagueRepository, getMatchRepository } from '@/repositories'
import { FeedScreen } from './feed-screen'

export default async function FeedPage() {
  const [matches, members] = await Promise.all([
    getMatchRepository().getMatches(),
    getLeagueRepository().getMembers('default'),
  ])

  const me = members.find(m => m.me) ?? { rank: 0, pts: 0, streak: 0 }

  return <FeedScreen matches={matches} me={{ rank: me.rank, pts: me.pts, streak: me.streak }} />
}
