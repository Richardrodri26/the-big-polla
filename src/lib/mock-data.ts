import type { LeaderboardEntry, Match, Prediction } from "@/types/domain";

const TEAMS = {
  ARG: { name: "Argentina", code: "AR", c1: "#74ACDF", c2: "#FFFFFF" },
  BRA: { name: "Brasil", code: "BR", c1: "#009C3B", c2: "#FFDF00" },
  FRA: { name: "Francia", code: "FR", c1: "#002395", c2: "#ED2939" },
  DEU: { name: "Alemania", code: "DE", c1: "#000000", c2: "#DD0000" },
  ESP: { name: "España", code: "ES", c1: "#AA151B", c2: "#F1BF00" },
} as const;

export const MOCK_MATCHES: Match[] = [
  {
    id: "m1",
    home: TEAMS.ARG,
    away: TEAMS.BRA,
    stage: "FASE DE GRUPOS",
    venue: "Estadio Monumental",
    date: "2026-06-15T20:00:00Z",
    status: "upcoming",
  },
  {
    id: "m2",
    home: TEAMS.FRA,
    away: TEAMS.DEU,
    stage: "CUARTOS DE FINAL",
    venue: "MetLife Stadium",
    date: "2026-06-20T18:00:00Z",
    status: "live",
    score: { home: 2, away: 1 },
    minute: 67,
  },
  {
    id: "m3",
    home: TEAMS.ESP,
    away: TEAMS.ARG,
    stage: "SEMIFINAL",
    venue: "Rose Bowl",
    date: "2026-06-10T15:00:00Z",
    status: "finished",
    score: { home: 1, away: 2 },
  },
];

export const MOCK_PREDICTION: Prediction = {
  matchId: "m3",
  home: 1,
  away: 2,
  locked: true,
  result: "exact",
  points: 5,
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "u1",
    name: "Carlos Méndez",
    points: 210,
    delta: "up",
    deltaValue: 2,
    isMe: false,
  },
  {
    rank: 2,
    userId: "u2",
    name: "Lucía Fernández",
    points: 185,
    delta: "flat",
    isMe: false,
  },
  {
    rank: 3,
    userId: "u3",
    name: "Martín López",
    points: 172,
    delta: "down",
    deltaValue: 1,
    isMe: false,
  },
  {
    rank: 4,
    userId: "u4",
    name: "Richard Rodriguez",
    points: 142,
    delta: "up",
    deltaValue: 3,
    isMe: true,
  },
  {
    rank: 5,
    userId: "u5",
    name: "Ana García",
    points: 138,
    delta: "down",
    deltaValue: 2,
    isMe: false,
  },
  {
    rank: 6,
    userId: "u6",
    name: "Pedro Suárez",
    points: 125,
    delta: "flat",
    isMe: false,
  },
];
