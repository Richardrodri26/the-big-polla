import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaScoreLogRepository } from '@/repositories/prisma/score-log.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    scoreLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockRow = {
  id: 'log-1',
  scoreId: 'score-1',
  matchId: 'match-1',
  pts: 7,
  type: 'match+streak',
  detail: {
    winner: 5,
    goalsHome: 0,
    goalsAway: 2,
    diff: 0,
    streakBonus: 0,
    prediction: { home: 1, away: 2 },
    result: { home: 0, away: 2 },
  },
  createdAt: new Date('2026-06-01T12:00:00Z'),
}

describe('PrismaScoreLogRepository', () => {
  let repo: PrismaScoreLogRepository
  beforeEach(() => {
    repo = new PrismaScoreLogRepository()
    vi.clearAllMocks()
  })

  describe('getScoreLog', () => {
    it('maps prisma rows to ScoreLogEntry[]', async () => {
      vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([mockRow] as any)

      const result = await repo.getScoreLog('user-1', 'league-1')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'log-1',
        matchId: 'match-1',
        pts: 7,
        type: 'match+streak',
        createdAt: '2026-06-01T12:00:00.000Z',
      })
    })

    it('returns empty array when no logs', async () => {
      vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([])
      expect(await repo.getScoreLog('user-1', 'league-1')).toEqual([])
    })
  })

  describe('getMatchScoreLog', () => {
    it('returns null when not found', async () => {
      vi.mocked(prisma.scoreLog.findFirst).mockResolvedValue(null)
      expect(await repo.getMatchScoreLog('user-1', 'league-1', 'match-1')).toBeNull()
    })

    it('maps row to ScoreLogEntry when found', async () => {
      vi.mocked(prisma.scoreLog.findFirst).mockResolvedValue(mockRow as any)
      const result = await repo.getMatchScoreLog('user-1', 'league-1', 'match-1')
      expect(result?.pts).toBe(7)
    })
  })
})
