import type { ILeagueRepository } from '@/repositories/interfaces'
import type { Badge, Member, ScoringRules } from '@/types/domain'

const MOCK_MEMBERS: Member[] = [
  {
    id: 'u1', name: 'Tania M.', handle: '@tania', color: '#00D26A',
    rank: 1, prevRank: 1, pts: 287, hits: 12, streak: 5,
    breakdown: { exact: 8, diff: 4, winner: 4, streakBonus: 22, comboBonus: 30, oraclePartial: 25 },
  },
  {
    id: 'u2', name: 'Carlos D.', handle: '@kdiaz', color: '#FF3D71',
    rank: 2, prevRank: 3, pts: 274, hits: 11, streak: 2,
    breakdown: { exact: 7, diff: 3, winner: 4, streakBonus: 8, comboBonus: 20, oraclePartial: 25 },
  },
  {
    id: 'u3', name: 'Mariana V.', handle: '@marivg', color: '#FFD60A',
    rank: 3, prevRank: 2, pts: 268, hits: 11, streak: 0,
    breakdown: { exact: 7, diff: 3, winner: 4, streakBonus: 5, comboBonus: 20, oraclePartial: 23 },
  },
  {
    id: 'u4', name: 'Tú', handle: '@you', color: '#08F7FE', me: true,
    rank: 4, prevRank: 7, pts: 252, hits: 10, streak: 3,
    breakdown: { exact: 6, diff: 4, winner: 4, streakBonus: 12, comboBonus: 10, oraclePartial: 22 },
  },
  {
    id: 'u5', name: 'Pablo R.', handle: '@prios', color: '#7C3AED',
    rank: 5, prevRank: 4, pts: 241, hits: 9, streak: 0,
    breakdown: { exact: 6, diff: 3, winner: 3, streakBonus: 4, comboBonus: 10, oraclePartial: 20 },
  },
  {
    id: 'u6', name: 'Lucía F.', handle: '@lucy', color: '#FB7185',
    rank: 6, prevRank: 5, pts: 233, hits: 9, streak: 1,
    breakdown: { exact: 6, diff: 3, winner: 3, streakBonus: 3, comboBonus: 10, oraclePartial: 18 },
  },
  {
    id: 'u7', name: 'Diego A.', handle: '@deigo', color: '#34D399',
    rank: 7, prevRank: 6, pts: 224, hits: 8, streak: 0,
    breakdown: { exact: 5, diff: 3, winner: 3, streakBonus: 2, comboBonus: 10, oraclePartial: 17 },
  },
  {
    id: 'u8', name: 'Valentina O.', handle: '@valeo', color: '#F59E0B',
    rank: 8, prevRank: 8, pts: 210, hits: 8, streak: 0,
    breakdown: { exact: 5, diff: 2, winner: 3, streakBonus: 2, comboBonus: 0, oraclePartial: 16 },
  },
  {
    id: 'u9', name: 'Sofía B.', handle: '@sofb', color: '#A78BFA',
    rank: 9, prevRank: 11, pts: 198, hits: 7, streak: 2,
    breakdown: { exact: 5, diff: 2, winner: 2, streakBonus: 4, comboBonus: 0, oraclePartial: 15 },
  },
]

const MOCK_SCORING_RULES: ScoringRules = {
  exact: 5,
  diff: 3,
  winner: 1,
  streakStep: 1,
  streakMax: 5,
  combo: 10,
  oracleChampion: 50,
}

const MOCK_BADGES: Badge[] = [
  { id: 'b1', num: '★', label: 'PRIMER EXACTO', unlocked: true },
  { id: 'b2', num: '3', label: 'RACHA × 3', unlocked: true },
  { id: 'b3', num: '10', label: '10 ACIERTOS', unlocked: false },
  { id: 'b4', num: '5', label: 'PLENO JORNADA', unlocked: false },
  { id: 'b5', num: '★★', label: 'EXACTO FINAL', unlocked: false },
  { id: 'b6', num: '∞', label: 'RACHA × 5', unlocked: false },
  { id: 'b7', num: '25', label: '25 PARTIDOS', unlocked: true },
  { id: 'b8', num: '🏆', label: 'CAMPEÓN LIGA', unlocked: false },
]

export class MockLeagueRepository implements ILeagueRepository {
  async getLeaderboard(_leagueId: string): Promise<Member[]> {
    return MOCK_MEMBERS
  }

  async getMembers(_leagueId: string): Promise<Member[]> {
    return MOCK_MEMBERS
  }

  async getScoringRules(_leagueId: string): Promise<ScoringRules> {
    return MOCK_SCORING_RULES
  }

  async getBadges(_userId: string): Promise<Badge[]> {
    return MOCK_BADGES
  }
}
