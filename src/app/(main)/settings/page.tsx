import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLeagueRepository } from '@/repositories'
import { SettingsScreen } from './settings-screen'

export default async function SettingsPage() {
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

  const [members, scoringRules, league, totalMatches, finalMatches, invite] = await Promise.all([
    getLeagueRepository(userId).getMembers(leagueId),
    getLeagueRepository(userId).getScoringRules(leagueId),
    prisma.league.findUnique({
      where: { id: leagueId },
      include: { owner: { select: { handle: true } } },
    }),
    prisma.match.count(),
    prisma.match.count({ where: { state: 'FINAL' } }),
    prisma.leagueInvite.findFirst({
      where: { leagueId },
      orderBy: { createdAt: 'desc' },
      select: { token: true },
    }),
  ])

  if (!league) redirect('/leagues')

  return (
    <SettingsScreen
      members={members}
      scoringRules={scoringRules}
      league={{
        name: league.name,
        ownerHandle: league.owner.handle,
        createdAt: league.createdAt.toISOString(),
        inviteToken: invite?.token ?? null,
      }}
      totalMatches={totalMatches}
      finalMatches={finalMatches}
    />
  )
}
