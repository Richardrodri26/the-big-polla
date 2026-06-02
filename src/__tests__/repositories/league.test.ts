import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaLeagueRepository } from '@/repositories/prisma/league.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    leagueMember: { findMany: vi.fn() },
    score: { findMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'

const mockMember = {
  id: 'lm1',
  leagueId: 'league1',
  userId: 'user1',
  joinedAt: new Date(),
  user: { id: 'user1', name: 'Richard', handle: 'richard', color: '#00D26A' },
}

const mockScore = {
  userId: 'user1',
  pts: 42,
  hits: 10,
  streak: 3,
  rank: 1,
  prevRank: 2,
  breakdown: { exact: 5, diff: 3, winner: 2, streakBonus: 1, comboBonus: 0, oraclePartial: 0 },
}

describe('PrismaLeagueRepository', () => {
  let repo: PrismaLeagueRepository

  beforeEach(() => {
    repo = new PrismaLeagueRepository('user1')
    vi.clearAllMocks()
  })

  describe('getMembers', () => {
    it('returns members with score data when score exists', async () => {
      vi.mocked(prisma.leagueMember.findMany).mockResolvedValue([mockMember] as any)
      vi.mocked(prisma.score.findMany).mockResolvedValue([mockScore] as any)

      const members = await repo.getMembers('league1')

      expect(members).toHaveLength(1)
      expect(members[0]).toMatchObject({
        id: 'user1',
        name: 'Richard',
        handle: 'richard',
        pts: 42,
        hits: 10,
        streak: 3,
        rank: 1,
        prevRank: 2,
        me: true,
      })
    })

    it('returns pts 0 and rank i+1 when no score for member', async () => {
      vi.mocked(prisma.leagueMember.findMany).mockResolvedValue([mockMember] as any)
      vi.mocked(prisma.score.findMany).mockResolvedValue([])

      const members = await repo.getMembers('league1')

      expect(members[0].pts).toBe(0)
      expect(members[0].rank).toBe(1)
    })
  })

  describe('getLeaderboard', () => {
    it('returns members sorted by pts descending', async () => {
      const member2 = {
        ...mockMember,
        id: 'lm2',
        userId: 'user2',
        user: { id: 'user2', name: 'Ana', handle: 'ana', color: '#FF4B4B' },
      }
      vi.mocked(prisma.leagueMember.findMany).mockResolvedValue([mockMember, member2] as any)
      vi.mocked(prisma.score.findMany).mockResolvedValue([
        mockScore,
        { ...mockScore, userId: 'user2', pts: 10, rank: 2, prevRank: 1 },
      ] as any)

      const leaderboard = await repo.getLeaderboard('league1')

      expect(leaderboard[0].pts).toBeGreaterThan(leaderboard[1].pts)
      expect(leaderboard[0].id).toBe('user1')
    })
  })

  describe('getScoringRules', () => {
    it('returns default rules', async () => {
      const rules = await repo.getScoringRules('league1')

      expect(rules).toMatchObject({ exact: 5, diff: 3, winner: 1, streakStep: 1, streakMax: 5 })
    })
  })
})
