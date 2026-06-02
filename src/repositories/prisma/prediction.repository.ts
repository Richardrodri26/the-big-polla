import { prisma } from '@/lib/prisma'
import type { IPredictionRepository } from '@/repositories/interfaces'
import type { Prediction } from '@/types/domain'

export class PrismaPredictionRepository implements IPredictionRepository {
  constructor(private readonly userId: string) {}

  async getPredictions(userId: string): Promise<Prediction[]> {
    const rows = await prisma.prediction.findMany({
      where: { userId },
      orderBy: { savedAt: 'desc' },
    })
    return rows.map(p => ({
      matchId: p.matchId,
      score: [p.homeScore, p.awayScore] as [number, number],
      savedAt: p.savedAt.toISOString(),
    }))
  }

  async savePrediction(matchId: string, score: [number, number]): Promise<void> {
    const [homeScore, awayScore] = score
    await prisma.prediction.upsert({
      where: { userId_matchId: { userId: this.userId, matchId } },
      update: { homeScore, awayScore },
      create: { userId: this.userId, matchId, homeScore, awayScore },
    })
  }
}
