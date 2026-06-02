import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaPredictionRepository } from '@/repositories/prisma/prediction.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    prediction: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockRow = {
  id: 'p1',
  userId: 'user1',
  matchId: 'm1',
  homeScore: 2,
  awayScore: 1,
  savedAt: new Date('2026-06-10T10:00:00Z'),
  updatedAt: new Date(),
}

describe('PrismaPredictionRepository', () => {
  let repo: PrismaPredictionRepository

  beforeEach(() => {
    repo = new PrismaPredictionRepository('user1')
    vi.clearAllMocks()
  })

  describe('getPredictions', () => {
    it('maps prisma row to domain Prediction', async () => {
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([mockRow] as any)

      const predictions = await repo.getPredictions('user1')

      expect(predictions).toHaveLength(1)
      expect(predictions[0]).toMatchObject({
        matchId: 'm1',
        score: [2, 1],
        savedAt: '2026-06-10T10:00:00.000Z',
      })
    })

    it('returns empty array when no predictions', async () => {
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([])

      expect(await repo.getPredictions('user1')).toEqual([])
    })
  })

  describe('savePrediction', () => {
    it('calls upsert with correct userId and matchId', async () => {
      vi.mocked(prisma.prediction.upsert).mockResolvedValue(mockRow as any)

      await repo.savePrediction('m1', [3, 0])

      expect(prisma.prediction.upsert).toHaveBeenCalledWith({
        where: { userId_matchId: { userId: 'user1', matchId: 'm1' } },
        update: { homeScore: 3, awayScore: 0 },
        create: { userId: 'user1', matchId: 'm1', homeScore: 3, awayScore: 0 },
      })
    })
  })
})
