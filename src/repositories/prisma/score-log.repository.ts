import { prisma } from '@/lib/prisma'
import type { IScoreLogRepository } from '@/repositories/interfaces'
import type { ScoreLogEntry } from '@/types/domain'

export class PrismaScoreLogRepository implements IScoreLogRepository {
  async getScoreLog(userId: string, leagueId: string): Promise<ScoreLogEntry[]> {
    const rows = await prisma.scoreLog.findMany({
      where: { score: { userId, leagueId } },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(this.mapRow)
  }

  async getMatchScoreLog(userId: string, leagueId: string, matchId: string): Promise<ScoreLogEntry | null> {
    const row = await prisma.scoreLog.findFirst({
      where: { score: { userId, leagueId }, matchId },
    })
    return row ? this.mapRow(row) : null
  }

  private mapRow(r: {
    id: string; matchId: string; pts: number; type: string; detail: unknown; createdAt: Date
  }): ScoreLogEntry {
    return {
      id: r.id,
      matchId: r.matchId,
      pts: r.pts,
      type: r.type,
      detail: r.detail as ScoreLogEntry['detail'],
      createdAt: r.createdAt.toISOString(),
    }
  }
}
