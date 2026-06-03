import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueRepository } from '@/repositories/prisma/league.repository'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params
  const repo = new PrismaLeagueRepository(session.user.id)
  const members = await repo.getLeaderboard(leagueId)

  return NextResponse.json({ members, updatedAt: new Date().toISOString() })
}
