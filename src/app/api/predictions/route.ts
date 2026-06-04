import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { matchId?: string; homeScore?: number; awayScore?: number }

  if (!body.matchId || body.homeScore === undefined || body.awayScore === undefined) {
    return NextResponse.json({ error: 'matchId, homeScore, awayScore are required' }, { status: 400 })
  }

  if (body.homeScore < 0 || body.awayScore < 0 || body.homeScore > 20 || body.awayScore > 20) {
    return NextResponse.json({ error: 'Invalid score values' }, { status: 400 })
  }

  const membership = await prisma.leagueMember.findFirst({
    where: { userId: session.user.id },
    select: { leagueId: true },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Tenés que unirte a una liga antes de predecir' }, { status: 403 })
  }

  const match = await prisma.match.findUnique({ where: { id: body.matchId } })
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  if (match.locked) {
    return NextResponse.json({ error: 'Match is locked — predictions are closed' }, { status: 409 })
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId: body.matchId } },
    update: { homeScore: body.homeScore, awayScore: body.awayScore },
    create: {
      userId: session.user.id,
      matchId: body.matchId,
      homeScore: body.homeScore,
      awayScore: body.awayScore,
    },
  })

  return NextResponse.json({ ok: true, prediction })
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')

  const predictions = await prisma.prediction.findMany({
    where: {
      userId: session.user.id,
      ...(matchId ? { matchId } : {}),
    },
    orderBy: { savedAt: 'desc' },
  })

  return NextResponse.json({ predictions })
}
