import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'
import { BrowseScreen } from './browse-screen'

const repo = new PrismaLeagueManagementRepository()

export default async function BrowsePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const { leagues, total } = await repo.getPublicLeagues({ limit: 20 })

  return <BrowseScreen initialLeagues={leagues} initialTotal={total} />
}
