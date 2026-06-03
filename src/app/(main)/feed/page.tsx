import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLeagueRepository, getMatchRepository, getPredictionRepository } from '@/repositories'
import { getWeeklyPts } from '@/lib/weekly-pts'
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

  const [matches, members, predictions, league, weeklyPts] = await Promise.all([
    getMatchRepository().getMatches(),
    leagueId ? getLeagueRepository(userId).getMembers(leagueId) : Promise.resolve([]),
    getPredictionRepository(userId).getPredictions(userId),
    leagueId
      ? prisma.league.findUnique({ where: { id: leagueId }, select: { name: true } })
      : Promise.resolve(null),
    leagueId ? getWeeklyPts(userId, leagueId) : Promise.resolve(0),
  ])

  const predMap = new Map(predictions.map(p => [p.matchId, p.score]))
  const matchesWithPreds = matches.map(m => ({ ...m, userPrediction: predMap.get(m.id) ?? null }))

  const sortedMembers = [...members].sort((a, b) => b.pts - a.pts)
  const me = members.find(m => m.me) ?? { rank: 0, prevRank: 0, pts: 0, streak: 0, name: 'Tú', color: '#08F7FE' }
  const leader = sortedMembers[0]
  const ptsBehindLeader = leader && leader.id !== (members.find(m => m.me)?.id) ? leader.pts - me.pts : 0

  return (
    <FeedScreen
      matches={matchesWithPreds}
      me={{
        rank: me.rank,
        prevRank: me.prevRank ?? 0,
        pts: me.pts,
        streak: me.streak,
        name: me.name,
        color: me.color,
      }}
      leagueName={league?.name ?? ''}
      totalMembers={members.length}
      ptsBehindLeader={ptsBehindLeader}
      weeklyPts={weeklyPts}
    />
  )
}
