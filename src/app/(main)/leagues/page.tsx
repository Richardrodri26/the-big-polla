import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'
import { LeaguesScreen } from './leagues-screen'

const repo = new PrismaLeagueManagementRepository()

export default async function LeaguesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const leagues = await repo.getUserLeagues(session.user.id)

  return <LeaguesScreen leagues={leagues} />
}
