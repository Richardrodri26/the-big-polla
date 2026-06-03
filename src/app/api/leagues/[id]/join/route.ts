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
  if (league.type !== 'PUBLIC') {
    return NextResponse.json({ error: 'This league requires a request to join' }, { status: 403 })
  }

  try {
    await repo.joinLeague(leagueId, session.user.id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('already a member')) {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 })
    }
    throw err
  }
}
