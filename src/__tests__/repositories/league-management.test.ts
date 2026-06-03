import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    league: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    leagueMember: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    leagueRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'

const mockLeague = {
  id: 'league1',
  name: 'Los Cracks',
  ownerId: 'user1',
  type: 'PRIVATE',
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { members: 3 },
}

describe('PrismaLeagueManagementRepository', () => {
  let repo: PrismaLeagueManagementRepository

  beforeEach(() => {
    repo = new PrismaLeagueManagementRepository()
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(prisma))
  })

  describe('createLeague', () => {
    it('creates and returns a League domain object', async () => {
      vi.mocked(prisma.league.create).mockResolvedValue(mockLeague as any)

      const league = await repo.createLeague({
        name: 'Los Cracks',
        type: 'PRIVATE',
        ownerId: 'user1',
      })

      expect(league).toMatchObject({
        id: 'league1',
        name: 'Los Cracks',
        ownerId: 'user1',
        type: 'PRIVATE',
      })
      expect(prisma.league.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Los Cracks', type: 'PRIVATE', ownerId: 'user1' },
        })
      )
    })
  })

  describe('joinLeague', () => {
    it('throws if user is already a member', async () => {
      vi.mocked(prisma.leagueMember.findUnique).mockResolvedValue({ id: 'lm1' } as any)

      await expect(repo.joinLeague('league1', 'user1')).rejects.toThrow('already a member')
    })

    it('creates a LeagueMember when not already a member', async () => {
      vi.mocked(prisma.leagueMember.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.leagueMember.create).mockResolvedValue({ id: 'lm1' } as any)

      await repo.joinLeague('league1', 'user2')

      expect(prisma.leagueMember.create).toHaveBeenCalledWith({
        data: { leagueId: 'league1', userId: 'user2' },
      })
    })
  })

  describe('requestAccess', () => {
    it('throws if user already has a pending request', async () => {
      vi.mocked(prisma.leagueRequest.findUnique).mockResolvedValue({
        id: 'r1',
        status: 'PENDING',
      } as any)

      await expect(repo.requestAccess('league1', 'user1')).rejects.toThrow('already pending')
    })

    it('creates a LeagueRequest with PENDING status', async () => {
      vi.mocked(prisma.leagueRequest.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.leagueRequest.create).mockResolvedValue({
        id: 'r1',
        leagueId: 'league1',
        userId: 'user1',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const request = await repo.requestAccess('league1', 'user1')

      expect(request.status).toBe('PENDING')
      expect(request.leagueId).toBe('league1')
    })
  })

  describe('approveRequest', () => {
    it('throws if request does not belong to ownerId league', async () => {
      vi.mocked(prisma.leagueRequest.findUnique).mockResolvedValue({
        id: 'r1',
        leagueId: 'league1',
        userId: 'user2',
        league: { ownerId: 'otherOwner' },
      } as any)

      await expect(repo.approveRequest('r1', 'user1')).rejects.toThrow('Not authorized')
    })

    it('creates LeagueMember and updates request to APPROVED', async () => {
      vi.mocked(prisma.leagueRequest.findUnique).mockResolvedValue({
        id: 'r1',
        leagueId: 'league1',
        userId: 'user2',
        status: 'PENDING',
        league: { ownerId: 'user1' },
      } as any)
      vi.mocked(prisma.leagueMember.create).mockResolvedValue({ id: 'lm1' } as any)
      vi.mocked(prisma.leagueRequest.update).mockResolvedValue({ id: 'r1' } as any)

      await repo.approveRequest('r1', 'user1')

      expect(prisma.leagueMember.create).toHaveBeenCalledWith({
        data: { leagueId: 'league1', userId: 'user2' },
      })
      expect(prisma.leagueRequest.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: 'APPROVED' },
      })
    })
  })

  describe('updateLeague', () => {
    it('throws if caller is not the owner', async () => {
      vi.mocked(prisma.league.findUnique).mockResolvedValue({ ...mockLeague, ownerId: 'user1' } as any)

      await expect(repo.updateLeague('league1', { name: 'Nuevo' }, 'user999')).rejects.toThrow('Not authorized')
    })
  })
})
