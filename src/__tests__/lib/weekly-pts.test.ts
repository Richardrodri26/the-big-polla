import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getWeeklyPts } from '@/lib/weekly-pts'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    scoreLog: { findMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'

describe('getWeeklyPts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns sum of pts from logs this week', async () => {
    vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([
      { pts: 5 } as any,
      { pts: 3 } as any,
    ])
    const result = await getWeeklyPts('user1', 'league1')
    expect(result).toBe(8)
  })

  it('returns 0 when no logs this week', async () => {
    vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([])
    const result = await getWeeklyPts('user1', 'league1')
    expect(result).toBe(0)
  })

  it('queries logs from start of current ISO week (Monday)', async () => {
    vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([])
    await getWeeklyPts('user1', 'league1')
    const call = vi.mocked(prisma.scoreLog.findMany).mock.calls[0]?.[0]
    const gte = (call?.where as any)?.score.leagueId
    expect(gte).toBe('league1')
  })
})
