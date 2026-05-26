import type { Badge, Match, MatchState, Member, Prediction, ScoringRules } from '@/types/domain'

export interface IMatchRepository {
  getMatches(filters?: { state?: MatchState }): Promise<Match[]>
  getMatch(id: string): Promise<Match | null>
}

export interface ILeagueRepository {
  getLeaderboard(leagueId: string): Promise<Member[]>
  getMembers(leagueId: string): Promise<Member[]>
  getScoringRules(leagueId: string): Promise<ScoringRules>
  getBadges(userId: string): Promise<Badge[]>
}

export interface IPredictionRepository {
  getPredictions(userId: string): Promise<Prediction[]>
  savePrediction(matchId: string, score: [number, number]): Promise<void>
}
