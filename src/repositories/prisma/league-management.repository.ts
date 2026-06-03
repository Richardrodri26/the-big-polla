import { prisma } from '@/lib/prisma'
import type { ILeagueManagementRepository } from '@/repositories/interfaces'
import type { League, LeagueRequest } from '@/types/domain'

function toDomainLeague(row: any): League {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    type: row.type as 'PUBLIC' | 'PRIVATE',
    createdAt: row.createdAt.toISOString(),
    memberCount: row._count?.members ?? row.members?.length,
    maxMembers: row.maxMembers ?? null,
  }
}

function toDomainRequest(row: any): LeagueRequest {
  return {
    id: row.id,
    leagueId: row.leagueId,
    userId: row.userId,
    status: row.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    createdAt: row.createdAt.toISOString(),
  }
}

export class PrismaLeagueManagementRepository implements ILeagueManagementRepository {
  async createLeague(data: { name: string; type: 'PUBLIC' | 'PRIVATE'; ownerId: string; maxMembers?: number | null }): Promise<League> {
    const row = await prisma.league.create({
      data: {
        name: data.name,
        type: data.type,
        ownerId: data.ownerId,
        maxMembers: data.maxMembers ?? null,
      },
      include: { _count: { select: { members: true } } },
    })
    return toDomainLeague(row)
  }

  async getLeague(id: string): Promise<League | null> {
    const row = await prisma.league.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    })
    return row ? toDomainLeague(row) : null
  }

  async updateLeague(id: string, data: { name?: string; type?: 'PUBLIC' | 'PRIVATE'; maxMembers?: number | null }, ownerId: string): Promise<League> {
    const existing = await prisma.league.findUnique({ where: { id } })
    if (!existing || existing.ownerId !== ownerId) {
      throw new Error('Not authorized to update this league')
    }
    const row = await prisma.league.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.maxMembers !== undefined ? { maxMembers: data.maxMembers } : {}),
      },
      include: { _count: { select: { members: true } } },
    })
    return toDomainLeague(row)
  }

  async deleteLeague(id: string, ownerId: string): Promise<void> {
    const existing = await prisma.league.findUnique({ where: { id } })
    if (!existing || existing.ownerId !== ownerId) {
      throw new Error('Not authorized to delete this league')
    }
    await prisma.league.delete({ where: { id } })
  }

  async joinLeague(leagueId: string, userId: string): Promise<void> {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: { members: { select: { id: true } } },
    })
    if (!league) throw new Error('League not found')

    if (league.maxMembers != null && (league as any).members.length >= league.maxMembers) {
      throw new Error('Liga llena')
    }

    await prisma.leagueMember.create({ data: { leagueId, userId } })
  }

  async leaveLeague(leagueId: string, userId: string): Promise<void> {
    await prisma.leagueMember.delete({
      where: { leagueId_userId: { leagueId, userId } },
    })
  }

  async requestAccess(leagueId: string, userId: string): Promise<LeagueRequest> {
    const existing = await prisma.leagueRequest.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    })
    if (existing?.status === 'PENDING') {
      throw new Error('Request is already pending for this league')
    }
    const row = await prisma.leagueRequest.create({
      data: { leagueId, userId, status: 'PENDING' },
    })
    return toDomainRequest(row)
  }

  async approveRequest(requestId: string, ownerId: string): Promise<void> {
    const request = await prisma.leagueRequest.findUnique({
      where: { id: requestId },
      include: {
        league: {
          include: { members: { select: { id: true } } },
        },
      },
    })
    if (!request) throw new Error('Request not found')
    if (request.league.ownerId !== ownerId) throw new Error('Not authorized to approve this request')

    if (
      request.league.maxMembers != null &&
      (request.league as any).members.length >= request.league.maxMembers
    ) {
      throw new Error('Liga llena')
    }

    await prisma.$transaction(async (tx) => {
      await tx.leagueMember.create({ data: { leagueId: request.leagueId, userId: request.userId } })
      await tx.leagueRequest.update({ where: { id: requestId }, data: { status: 'APPROVED' } })
    })
  }

  async rejectRequest(requestId: string, ownerId: string): Promise<void> {
    const request = await prisma.leagueRequest.findUnique({
      where: { id: requestId },
      include: { league: { select: { ownerId: true } } },
    })
    if (!request || request.league.ownerId !== ownerId) {
      throw new Error('Not authorized to reject this request')
    }
    await prisma.leagueRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } })
  }

  async getUserLeagues(userId: string): Promise<League[]> {
    const rows = await prisma.league.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toDomainLeague)
  }

  async getPendingRequests(leagueId: string, ownerId: string): Promise<LeagueRequest[]> {
    const league = await prisma.league.findUnique({ where: { id: leagueId } })
    if (!league || league.ownerId !== ownerId) {
      throw new Error('Not authorized to view requests for this league')
    }
    const rows = await prisma.leagueRequest.findMany({
      where: { leagueId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(toDomainRequest)
  }
}
