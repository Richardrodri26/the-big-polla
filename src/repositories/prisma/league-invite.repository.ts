import { prisma } from '@/lib/prisma'
import type { ILeagueInviteRepository } from '@/repositories/interfaces'
import type { LeagueInvite } from '@/types/domain'

type EnrichedInvite = LeagueInvite & { leagueName: string; memberCount: number }

export class PrismaLeagueInviteRepository implements ILeagueInviteRepository {
  async createInvite(leagueId: string, createdBy: string, expiresAt?: Date): Promise<LeagueInvite> {
    const row = await prisma.leagueInvite.create({
      data: { leagueId, createdBy, expiresAt },
    })
    return this.mapRow(row)
  }

  async getInviteByToken(token: string): Promise<EnrichedInvite | null> {
    const row = await prisma.leagueInvite.findUnique({
      where: { token },
      include: { league: { select: { name: true, _count: { select: { members: true } } } } },
    })
    if (!row) return null
    return {
      ...this.mapRow(row),
      leagueName: (row as any).league.name,
      memberCount: (row as any).league._count.members,
    }
  }

  async listInvites(leagueId: string): Promise<LeagueInvite[]> {
    const rows = await prisma.leagueInvite.findMany({ where: { leagueId } })
    return rows.map(r => this.mapRow(r))
  }

  async deleteInvite(id: string, requesterId: string): Promise<void> {
    await prisma.leagueInvite.delete({ where: { id, createdBy: requesterId } })
  }

  async incrementUsedCount(token: string): Promise<void> {
    await prisma.leagueInvite.update({
      where: { token },
      data: { usedCount: { increment: 1 } },
    })
  }

  private mapRow(r: {
    id: string; leagueId: string; token: string; createdBy: string; expiresAt: Date | null; usedCount: number; createdAt: Date
  }): LeagueInvite {
    return {
      id: r.id,
      leagueId: r.leagueId,
      token: r.token,
      createdBy: r.createdBy,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      usedCount: r.usedCount,
      createdAt: r.createdAt.toISOString(),
    }
  }
}
