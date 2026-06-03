import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLeagueRepository, getMatchRepository, getPredictionRepository } from '@/repositories'
import { FeedScreen } from './feed-screen'

export default async function FeedPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const userId = session.user.id

  const firstMembership = await prisma.leagueMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
    select: { leagueId: true },
  })

  const leagueId = firstMembership?.leagueId

  const [matches, members, predictions] = await Promise.all([
    getMatchRepository().getMatches(),
    leagueId ? getLeagueRepository(userId).getMembers(leagueId) : Promise.resolve([]),
    getPredictionRepository(userId).getPredictions(userId),
  ])

  const predMap = new Map(predictions.map(p => [p.matchId, p.score]))
  const matchesWithPreds = matches.map(m => ({ ...m, userPrediction: predMap.get(m.id) ?? null }))

  const me = members.find(m => m.me) ?? { rank: 0, pts: 0, streak: 0 }

  return <FeedScreen matches={matchesWithPreds} me={{ rank: me.rank, pts: me.pts, streak: me.streak }} />
}
