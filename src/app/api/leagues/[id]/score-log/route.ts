import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaScoreLogRepository } from '@/repositories/prisma/score-log.repository'

const repo = new PrismaScoreLogRepository()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')

  if (matchId) {
    const entry = await repo.getMatchScoreLog(session.user.id, leagueId, matchId)
    return NextResponse.json({ entry })
  }

  const logs = await repo.getScoreLog(session.user.id, leagueId)
  return NextResponse.json({ logs })
}
