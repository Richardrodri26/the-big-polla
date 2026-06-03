import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLeagueRepository } from '@/repositories'
import { LeaderboardClient } from './leaderboard-client'

export default async function LeaderboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const userId = session.user.id

  const firstMembership = await prisma.leagueMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
    select: { leagueId: true },
  })

  if (!firstMembership) redirect('/leagues')

  const leagueId = firstMembership.leagueId

  const [members, scoringRules] = await Promise.all([
    getLeagueRepository(userId).getLeaderboard(leagueId),
    getLeagueRepository(userId).getScoringRules(leagueId),
  ])

  return (
    <LeaderboardClient
      leagueId={leagueId}
      initialMembers={members}
      scoringRules={scoringRules}
    />
  )
}
