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
  if (league.type !== 'PRIVATE') {
    return NextResponse.json({ error: 'This is a public league — use /join instead' }, { status: 400 })
  }

  try {
    const request = await repo.requestAccess(leagueId, session.user.id)
    return NextResponse.json({ request }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('already pending')) {
      return NextResponse.json({ error: 'Request already pending' }, { status: 409 })
    }
    throw err
  }
}
