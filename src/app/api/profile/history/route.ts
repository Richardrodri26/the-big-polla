import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import type { PredictionHistoryItem } from '@/types/domain'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const leagueId = searchParams.get('leagueId')
  const cursor = searchParams.get('cursor') ?? undefined
  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 30)

  const userId = session.user.id

  const predictions = await prisma.prediction.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      match: true,
    },
  })

  const hasMore = predictions.length > limit
  const items = predictions.slice(0, limit)

  const scoreLogs = leagueId
    ? await prisma.scoreLog.findMany({
        where: {
          score: { userId, leagueId },
          matchId: { in: items.map(p => p.matchId) },
        },
      })
    : []

  const scoreLogMap = new Map(scoreLogs.map(l => [l.matchId, l]))

  const history: PredictionHistoryItem[] = items.map(p => {
    const m = p.match
    const log = scoreLogMap.get(p.matchId)
    const detail = log?.detail as Record<string, number> | null

    return {
      matchId: p.matchId,
      kickoffAt: m.kickoffAt.toISOString(),
      stage: m.stage,
      home: { code: m.homeTeamCode, name: m.homeTeamName, c1: m.homeTeamC1, c2: m.homeTeamC2 },
      away: { code: m.awayTeamCode, name: m.awayTeamName, c1: m.awayTeamC1, c2: m.awayTeamC2 },
      result: m.homeScore !== null && m.awayScore !== null ? [m.homeScore, m.awayScore] : null,
      prediction: [p.homeScore, p.awayScore],
      pts: log?.pts ?? 0,
      scoreLog: detail
        ? {
            winner: detail.winner ?? 0,
            goalsHome: detail.goalsHome ?? 0,
            goalsAway: detail.goalsAway ?? 0,
            diff: detail.diff ?? 0,
            streakBonus: detail.streakBonus ?? 0,
          }
        : null,
    }
  })

  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({ history, nextCursor, hasMore })
}
