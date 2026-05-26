export type MatchState = 'live' | 'pending' | 'final'

export interface Team {
  code: string
  name: string
  c1: string
  c2: string
}

export interface MatchTimeline {
  min: number
  head: string
  body: string
}

export interface Match {
  id: string
  state: MatchState
  kickoffAt: string           // ISO 8601 — client derives display strings from this
  venue: string
  stage: string
  home: Team
  away: Team
  locked: boolean
  liveMinute?: number         // e.g. 78 — only present when state === 'live'
  score?: [number, number]    // only present when state !== 'pending'
  userPrediction?: [number, number] | null
  pts?: number                // pre-calculated by backend — client only displays
  basePts?: number
  streakBonus?: number
  correctOutcome?: boolean
  correctScore?: boolean
  timeline?: MatchTimeline[]
}

export interface Member {
  id: string
  name: string
  handle: string
  color: string
  rank: number
  prevRank: number
  pts: number
  hits: number
  streak: number
  me?: boolean
  breakdown: {
    exact: number
    diff: number
    winner: number
    streakBonus: number
    comboBonus: number
    oraclePartial: number
  }
}

export interface Prediction {
  matchId: string
  score: [number, number]
  savedAt: string  // ISO 8601
}

export interface ScoringRules {
  exact: number
  diff: number
  winner: number
  streakStep: number
  streakMax: number
  combo: number
  oracleChampion: number
}

export interface Badge {
  id: string
  num: string
  label: string
  unlocked: boolean
}
