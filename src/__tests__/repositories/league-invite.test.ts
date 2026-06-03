import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaLeagueInviteRepository } from '@/repositories/prisma/league-invite.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    leagueInvite: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockInvite = {
  id: 'inv-1',
  leagueId: 'lg-1',
  token: 'tok-abc',
  createdBy: 'user-1',
  expiresAt: null,
  usedCount: 0,
  createdAt: new Date('2026-06-03T00:00:00Z'),
}

describe('PrismaLeagueInviteRepository', () => {
  let repo: PrismaLeagueInviteRepository
  beforeEach(() => {
    repo = new PrismaLeagueInviteRepository()
    vi.clearAllMocks()
  })

  it('createInvite maps and returns LeagueInvite', async () => {
    vi.mocked(prisma.leagueInvite.create).mockResolvedValue(mockInvite as any)
    const result = await repo.createInvite('lg-1', 'user-1')
    expect(result.token).toBe('tok-abc')
    expect(result.createdAt).toBe('2026-06-03T00:00:00.000Z')
  })

  it('getInviteByToken returns null when not found', async () => {
    vi.mocked(prisma.leagueInvite.findUnique).mockResolvedValue(null)
    expect(await repo.getInviteByToken('bad-token')).toBeNull()
  })

  it('getInviteByToken returns enriched invite when found', async () => {
    vi.mocked(prisma.leagueInvite.findUnique).mockResolvedValue({
      ...mockInvite,
      league: { name: 'Liga Test', _count: { members: 3 } },
    } as any)
    const result = await repo.getInviteByToken('tok-abc')
    expect(result?.leagueName).toBe('Liga Test')
    expect(result?.memberCount).toBe(3)
  })

  it('incrementUsedCount calls update', async () => {
    vi.mocked(prisma.leagueInvite.update).mockResolvedValue(mockInvite as any)
    await repo.incrementUsedCount('tok-abc')
    expect(prisma.leagueInvite.update).toHaveBeenCalledWith({
      where: { token: 'tok-abc' },
      data: { usedCount: { increment: 1 } },
    })
  })
})
