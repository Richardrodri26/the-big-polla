import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'
import { prisma } from '@/lib/prisma'

const repo = new PrismaLeagueManagementRepository()

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params

  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 })
  if (league.ownerId === session.user.id) {
    return NextResponse.json({ error: 'Owner cannot leave their own league' }, { status: 403 })
  }

  await repo.leaveLeague(leagueId, session.user.id)
  return NextResponse.json({ ok: true })
}
