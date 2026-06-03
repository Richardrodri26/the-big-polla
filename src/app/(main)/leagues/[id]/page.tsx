import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'
import { PrismaLeagueRepository } from '@/repositories/prisma/league.repository'
import { LeagueDetailScreen } from './league-detail-screen'

const mgmtRepo = new PrismaLeagueManagementRepository()

export default async function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return notFound()

  const league = await mgmtRepo.getLeague(id)
  if (!league) return notFound()

  const leagueRepo = new PrismaLeagueRepository(session.user.id)
  const [members, rules] = await Promise.all([
    leagueRepo.getLeaderboard(id),
    leagueRepo.getScoringRules(id),
  ])

  const isOwner = league.ownerId === session.user.id
  const pendingRequests = isOwner ? await mgmtRepo.getPendingRequests(id, session.user.id) : []

  return (
    <LeagueDetailScreen
      league={league}
      members={members}
      rules={rules}
      pendingRequests={pendingRequests}
      isOwner={isOwner}
      currentUserId={session.user.id}
    />
  )
}
