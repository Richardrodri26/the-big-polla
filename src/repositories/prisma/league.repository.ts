import { prisma } from '@/lib/prisma'
import type { ILeagueRepository } from '@/repositories/interfaces'
import type { Badge, Member, ScoringRules } from '@/types/domain'

const DEFAULT_SCORING_RULES: ScoringRules = {
  exact: 5,
  diff: 3,
  winner: 1,
  streakStep: 1,
  streakMax: 5,
  combo: 0,
  oracleChampion: 50,
}

export class PrismaLeagueRepository implements ILeagueRepository {
  constructor(private readonly currentUserId?: string) {}

  private async getMembersWithScores(leagueId: string): Promise<Member[]> {
    const [members, scores] = await Promise.all([
      prisma.leagueMember.findMany({
        where: { leagueId },
        include: { user: { select: { id: true, name: true, handle: true, color: true } } },
      }),
      prisma.score.findMany({ where: { leagueId } }),
    ])

    const scoreMap = new Map(scores.map(s => [s.userId, s]))

    return members.map((m, i) => {
      const s = scoreMap.get(m.userId)
      return {
        id: m.userId,
        name: m.user.name,
        handle: m.user.handle ?? '',
        color: m.user.color ?? '#00D26A',
        rank: s?.rank ?? i + 1,
        prevRank: s?.prevRank ?? i + 1,
        pts: s?.pts ?? 0,
        hits: s?.hits ?? 0,
        streak: s?.streak ?? 0,
        me: m.userId === this.currentUserId,
        breakdown: (s?.breakdown as Member['breakdown']) ?? {
          exact: 0,
          diff: 0,
          winner: 0,
          streakBonus: 0,
          comboBonus: 0,
          oraclePartial: 0,
        },
      }
    })
  }

  async getLeaderboard(leagueId: string): Promise<Member[]> {
    const members = await this.getMembersWithScores(leagueId)
    return members.sort((a, b) => b.pts - a.pts)
  }

  async getMembers(leagueId: string): Promise<Member[]> {
    return this.getMembersWithScores(leagueId)
  }

  async getScoringRules(_leagueId: string): Promise<ScoringRules> {
    return DEFAULT_SCORING_RULES
  }

  async getBadges(_userId: string): Promise<Badge[]> {
    return []
  }
}
