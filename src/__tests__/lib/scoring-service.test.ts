import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScoringService } from '@/lib/scoring-service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    match: { findUnique: vi.fn() },
    prediction: { findMany: vi.fn() },
    score: { upsert: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    scoreLog: { create: vi.fn(), findMany: vi.fn() },
    leagueMember: { findMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'

const mockMatch = {
  id: 'm1',
  state: 'FINAL',
  stage: 'Grupo A',
  homeScore: 2,
  awayScore: 1,
  kickoffAt: new Date('2026-06-15T18:00:00Z'),
}

const mockPrediction = {
  id: 'p1',
  userId: 'user1',
  matchId: 'm1',
  homeScore: 2,
  awayScore: 1,
  savedAt: new Date(),
  updatedAt: new Date(),
  user: { id: 'user1', name: 'Richard', handle: 'richard' },
}

const mockLeagueMember = {
  leagueId: 'league1',
  userId: 'user1',
}

describe('ScoringService', () => {
  let service: ScoringService

  beforeEach(() => {
    service = new ScoringService()
    vi.clearAllMocks()

    // Default: transaction executes the callback inline
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(prisma))
  })

  describe('scoreMatch', () => {
    it('throws if match is not FINAL', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue({
        ...mockMatch,
        state: 'LIVE',
      } as any)

      await expect(service.scoreMatch('m1')).rejects.toThrow('Match m1 is not FINAL')
    })

    it('throws if match result is null', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue({
        ...mockMatch,
        homeScore: null,
        awayScore: null,
      } as any)

      await expect(service.scoreMatch('m1')).rejects.toThrow('Match m1 has no result')
    })

    it('creates scoreLog with correct pts for exact prediction', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue(mockMatch as any)
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([mockPrediction] as any)
      vi.mocked(prisma.leagueMember.findMany).mockResolvedValue([mockLeagueMember] as any)
      vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.score.upsert).mockResolvedValue({ id: 's1', pts: 10, hits: 1, streak: 1 } as any)
      vi.mocked(prisma.scoreLog.create).mockResolvedValue({ id: 'sl1' } as any)
      vi.mocked(prisma.score.findMany).mockResolvedValue([])

      await service.scoreMatch('m1')

      expect(prisma.scoreLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            matchId: 'm1',
            pts: 10, // 5 winner + 2 goalsHome + 2 goalsAway + 1 diff
            type: 'match',
          }),
        })
      )
    })

    it('skips users with no prediction for the match', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue(mockMatch as any)
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([])
      vi.mocked(prisma.leagueMember.findMany).mockResolvedValue([mockLeagueMember] as any)
      vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.score.findMany).mockResolvedValue([])

      await service.scoreMatch('m1')

      expect(prisma.scoreLog.create).not.toHaveBeenCalled()
    })
  })
})
