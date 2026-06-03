import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLeagueRepository, getMatchRepository } from '@/repositories'
import { getWeeklyPts } from '@/lib/weekly-pts'
import { DashboardScreen } from './dashboard-screen'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
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

  const [matches, members, league, totalFinalMatches, weeklyPts] = await Promise.all([
    getMatchRepository().getMatches(),
    getLeagueRepository(userId).getMembers(leagueId),
    prisma.league.findUnique({ where: { id: leagueId }, select: { name: true } }),
    prisma.match.count({ where: { state: 'FINAL' } }),
    getWeeklyPts(userId, leagueId),
  ])

  return (
    <DashboardScreen
      matches={matches}
      members={members}
      leagueName={league?.name ?? ''}
      totalFinalMatches={totalFinalMatches}
      weeklyPts={weeklyPts}
    />
  )
}
