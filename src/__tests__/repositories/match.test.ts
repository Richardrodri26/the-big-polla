import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaMatchRepository } from '@/repositories/prisma/match.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockRow = {
  id: 'm1',
  state: 'PENDING',
  kickoffAt: new Date('2026-06-15T18:00:00Z'),
  venue: 'Estadio Azteca, CDMX',
  stage: 'Grupo A',
  homeTeamCode: 'ARG',
  homeTeamName: 'Argentina',
  homeTeamC1: '#74ACDF',
  homeTeamC2: '#FFFFFF',
  awayTeamCode: 'FRA',
  awayTeamName: 'Francia',
  awayTeamC1: '#0055A4',
  awayTeamC2: '#EF4135',
  locked: false,
  liveMinute: null,
  homeScore: null,
  awayScore: null,
  timeline: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('PrismaMatchRepository', () => {
  let repo: PrismaMatchRepository

  beforeEach(() => {
    repo = new PrismaMatchRepository()
    vi.clearAllMocks()
  })

  describe('getMatches', () => {
    it('maps prisma row to domain Match', async () => {
      vi.mocked(prisma.match.findMany).mockResolvedValue([mockRow] as any)

      const matches = await repo.getMatches()

      expect(matches).toHaveLength(1)
      expect(matches[0]).toMatchObject({
        id: 'm1',
        state: 'pending',
        venue: 'Estadio Azteca, CDMX',
        home: { code: 'ARG', name: 'Argentina', c1: '#74ACDF', c2: '#FFFFFF' },
        away: { code: 'FRA', name: 'Francia', c1: '#0055A4', c2: '#EF4135' },
        locked: false,
      })
    })

    it('maps homeScore/awayScore to score tuple when both are present', async () => {
      vi.mocked(prisma.match.findMany).mockResolvedValue([
        { ...mockRow, state: 'FINAL', homeScore: 2, awayScore: 1 },
      ] as any)

      const [match] = await repo.getMatches()

      expect(match.score).toEqual([2, 1])
    })

    it('leaves score undefined when homeScore is null', async () => {
      vi.mocked(prisma.match.findMany).mockResolvedValue([mockRow] as any)

      const [match] = await repo.getMatches()

      expect(match.score).toBeUndefined()
    })

    it('passes state filter as uppercase to prisma', async () => {
      vi.mocked(prisma.match.findMany).mockResolvedValue([])

      await repo.getMatches({ state: 'live' })

      expect(prisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { state: 'LIVE' } })
      )
    })
  })

  describe('getMatch', () => {
    it('returns null when not found', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue(null)

      expect(await repo.getMatch('nonexistent')).toBeNull()
    })

    it('returns domain Match when found', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue(mockRow as any)

      expect((await repo.getMatch('m1'))?.id).toBe('m1')
    })
  })
})
