export interface Team {
  name: string;
  code: string;
  c1: string;
  c2: string;
}

export type MatchStatus = "live" | "upcoming" | "finished";

export interface Match {
  id: string;
  home: Team;
  away: Team;
  stage: string;
  venue: string;
  date: string;
  status: MatchStatus;
  score?: { home: number; away: number };
  minute?: number;
}

export type PredictionResult = "exact" | "diff" | "winner" | "miss";

export interface Prediction {
  matchId: string;
  home: number;
  away: number;
  locked: boolean;
  result?: PredictionResult;
  points?: number;
}

export type DeltaDirection = "up" | "down" | "flat";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  points: number;
  delta: DeltaDirection;
  deltaValue?: number;
  isMe: boolean;
}
