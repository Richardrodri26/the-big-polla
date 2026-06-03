import { prisma } from '@/lib/prisma'
import { computePredictionBreakdown } from '@/lib/prediction-breakdown'
import type { IMatchRepository } from '@/repositories/interfaces'
import type { Match, MatchState, MatchTimeline } from '@/types/domain'
import type { Match as PrismaMatch } from '@/generated/prisma'

function toDomainMatch(m: PrismaMatch): Match {
  return {
    id: m.id,
    state: m.state.toLowerCase() as MatchState,
    kickoffAt: m.kickoffAt.toISOString(),
    venue: m.venue,
    stage: m.stage,
    home: {
      code: m.homeTeamCode,
      name: m.homeTeamName,
      c1: m.homeTeamC1,
      c2: m.homeTeamC2,
    },
    away: {
      code: m.awayTeamCode,
      name: m.awayTeamName,
      c1: m.awayTeamC1,
      c2: m.awayTeamC2,
    },
    locked: m.locked,
    liveMinute: m.liveMinute ?? undefined,
    score:
      m.homeScore !== null && m.awayScore !== null
        ? [m.homeScore, m.awayScore]
        : undefined,
    timeline: m.timeline ? (m.timeline as unknown as MatchTimeline[]) : undefined,
  }
}

export class PrismaMatchRepository implements IMatchRepository {
  async getMatches(filters?: { state?: MatchState }): Promise<Match[]> {
    const rows = await prisma.match.findMany({
      where: filters?.state ? { state: filters.state.toUpperCase() as PrismaMatch['state'] } : undefined,
      orderBy: { kickoffAt: 'asc' },
    })
    return rows.map(toDomainMatch)
  }

  async getMatch(id: string): Promise<Match | null> {
    const [row, preds] = await Promise.all([
      prisma.match.findUnique({ where: { id } }),
      prisma.prediction.findMany({
        where: { matchId: id },
        select: { homeScore: true, awayScore: true },
      }),
    ])
    if (!row) return null
    const domain = toDomainMatch(row)
    const breakdown = computePredictionBreakdown(preds)
    if (breakdown) domain.predictionBreakdown = breakdown
    return domain
  }
}
