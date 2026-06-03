import type { Badge, League, LeagueMember, LeagueRequest, Match, MatchState, Member, Prediction, ScoringRules } from '@/types/domain'

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

export interface ILeagueManagementRepository {
  createLeague(data: { name: string; type: 'PUBLIC' | 'PRIVATE'; ownerId: string; maxMembers?: number | null }): Promise<League>
  updateLeague(id: string, data: { name?: string; type?: 'PUBLIC' | 'PRIVATE'; maxMembers?: number | null }, ownerId: string): Promise<League>
  deleteLeague(id: string, ownerId: string): Promise<void>
  joinLeague(leagueId: string, userId: string): Promise<void>
  leaveLeague(leagueId: string, userId: string): Promise<void>
  requestAccess(leagueId: string, userId: string): Promise<LeagueRequest>
  approveRequest(requestId: string, ownerId: string): Promise<void>
  rejectRequest(requestId: string, ownerId: string): Promise<void>
  getLeague(id: string): Promise<League | null>
  getUserLeagues(userId: string): Promise<League[]>
  getPendingRequests(leagueId: string, ownerId: string): Promise<LeagueRequest[]>
}
