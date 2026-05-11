export interface Team {
  code: string;
  name: string;
  c1: string;
  c2: string;
  group?: string;
  seed?: number;
  key?: string;
}

export interface MatchTimeline {
  min: number;
  head: string;
  body: string;
}

export type MatchState = "live" | "pending" | "final";

export interface FeedMatch {
  id: string;
  state: MatchState;
  dayLabel: string;
  dateNum: string;
  monthShort: string;
  weekday: string;
  time: string;
  venue: string;
  stage: string;
  home: Team;
  away: Team;
  score?: [number, number];
  myPred?: [number, number] | null;
  pts?: number | null;
  basePts?: number;
  streakBonus?: number;
  comboBonus?: number;
  streakAt?: number;
  correctOutcome?: boolean;
  correctScore?: boolean;
  kickoffIn?: string;
  locked?: boolean;
  timeline?: MatchTimeline[];
}

export interface Member {
  id: string;
  name: string;
  handle: string;
  pts: number;
  prevRank: number;
  rank: number;
  hits: number;
  streak: number;
  color: string;
  me?: boolean;
  breakdown: {
    exact: number;
    diff: number;
    winner: number;
    streakBonus: number;
    comboBonus: number;
    oraclePartial: number;
  };
}

export interface ScoringRules {
  exact: number;
  diff: number;
  winner: number;
  streakStep: number;
  streakMax: number;
  combo: number;
  oracleChampion: number;
}

export interface BracketSlot {
  id: string;
  top: string | null;
  bot: string | null;
  picked: string | null;
}

export interface RoundLabel {
  key: string;
  label: string;
  short: string;
  count: string;
}

export interface Badge {
  id: string;
  num: string;
  label: string;
  unlocked: boolean;
}

const GROUPS: Record<string, Team[]> = {
  A: [
    { code: "MEX", name: "México", c1: "#006847", c2: "#CE1126" },
    { code: "CAN", name: "Canadá", c1: "#D80027", c2: "#FFFFFF" },
    { code: "ECU", name: "Ecuador", c1: "#FFCE00", c2: "#0033A0" },
    { code: "URU", name: "Uruguay", c1: "#5CBFEB", c2: "#FFFFFF" },
  ],
  B: [
    { code: "USA", name: "Estados Unidos", c1: "#0A3161", c2: "#B31942" },
    { code: "WAL", name: "Gales", c1: "#C8102E", c2: "#00B140" },
    { code: "IRN", name: "Irán", c1: "#239F40", c2: "#DA0000" },
    { code: "POR", name: "Portugal", c1: "#006600", c2: "#FF0000" },
  ],
  C: [
    { code: "ARG", name: "Argentina", c1: "#74ACDF", c2: "#FFFFFF" },
    { code: "POL", name: "Polonia", c1: "#DC143C", c2: "#FFFFFF" },
    { code: "KSA", name: "Arabia Saudita", c1: "#006C35", c2: "#FFFFFF" },
    { code: "AUS", name: "Australia", c1: "#012169", c2: "#FFCD00" },
  ],
  D: [
    { code: "FRA", name: "Francia", c1: "#0055A4", c2: "#EF4135" },
    { code: "DEN", name: "Dinamarca", c1: "#C8102E", c2: "#FFFFFF" },
    { code: "TUN", name: "Túnez", c1: "#E70013", c2: "#FFFFFF" },
    { code: "MAR", name: "Marruecos", c1: "#C1272D", c2: "#006233" },
  ],
  E: [
    { code: "ESP", name: "España", c1: "#AA151B", c2: "#F1BF00" },
    { code: "GER", name: "Alemania", c1: "#000000", c2: "#FFCE00" },
    { code: "JPN", name: "Japón", c1: "#BC002D", c2: "#FFFFFF" },
    { code: "CRC", name: "Costa Rica", c1: "#002B7F", c2: "#CE1126" },
  ],
  F: [
    { code: "BEL", name: "Bélgica", c1: "#000000", c2: "#FFD90C" },
    { code: "CRO", name: "Croacia", c1: "#171796", c2: "#FF0000" },
    { code: "CMR", name: "Camerún", c1: "#007A5E", c2: "#CE1126" },
    { code: "BRA", name: "Brasil", c1: "#009C3B", c2: "#FFDF00" },
  ],
  G: [
    { code: "BRA", name: "Brasil", c1: "#009C3B", c2: "#FFDF00" },
    { code: "SUI", name: "Suiza", c1: "#FF0000", c2: "#FFFFFF" },
    { code: "SRB", name: "Serbia", c1: "#C6363C", c2: "#0C4076" },
    { code: "GHA", name: "Ghana", c1: "#CE1126", c2: "#FCD116" },
  ],
  H: [
    { code: "POR", name: "Portugal", c1: "#006600", c2: "#FF0000" },
    { code: "URU", name: "Uruguay", c1: "#5CBFEB", c2: "#FFFFFF" },
    { code: "KOR", name: "Corea del Sur", c1: "#0047A0", c2: "#CD2E3A" },
    { code: "GHA", name: "Ghana", c1: "#CE1126", c2: "#FCD116" },
  ],
  I: [
    { code: "ITA", name: "Italia", c1: "#009246", c2: "#CE2B37" },
    { code: "NED", name: "Países Bajos", c1: "#AE1C28", c2: "#21468B" },
    { code: "EGY", name: "Egipto", c1: "#CE1126", c2: "#000000" },
    { code: "PAR", name: "Paraguay", c1: "#D52B1E", c2: "#0038A8" },
  ],
  J: [
    { code: "ENG", name: "Inglaterra", c1: "#FFFFFF", c2: "#CE1124" },
    { code: "COL", name: "Colombia", c1: "#FCD116", c2: "#003893" },
    { code: "SEN", name: "Senegal", c1: "#00853F", c2: "#FDEF42" },
    { code: "CHI", name: "Chile", c1: "#D52B1E", c2: "#0039A6" },
  ],
  K: [
    { code: "NGA", name: "Nigeria", c1: "#008751", c2: "#FFFFFF" },
    { code: "TUR", name: "Turquía", c1: "#E30A17", c2: "#FFFFFF" },
    { code: "PER", name: "Perú", c1: "#D91023", c2: "#FFFFFF" },
    { code: "ALG", name: "Argelia", c1: "#006233", c2: "#FFFFFF" },
  ],
  L: [
    { code: "SCO", name: "Escocia", c1: "#0065BD", c2: "#FFFFFF" },
    { code: "VEN", name: "Venezuela", c1: "#FCD116", c2: "#CF142B" },
    { code: "AUT", name: "Austria", c1: "#ED2939", c2: "#FFFFFF" },
    { code: "QAT", name: "Catar", c1: "#8A1538", c2: "#FFFFFF" },
  ],
};

export const ALL_GROUPS = GROUPS;

export const TEAMS: Record<string, Team> = {};
Object.entries(GROUPS).forEach(([g, teams]) => {
  teams.forEach((t, i) => {
    const key = `${g}${i + 1}`;
    TEAMS[key] = { ...t, group: g, seed: i + 1, key };
  });
});

const T = TEAMS;

export const FEED_MATCHES: FeedMatch[] = [
  {
    id: "m1",
    state: "live",
    dayLabel: "HOY",
    dateNum: "11",
    monthShort: "JUN",
    weekday: "JUE",
    time: "78'",
    venue: "Estadio Azteca, CDMX",
    stage: "Grupo A",
    home: T.A1,
    away: T.A2,
    score: [2, 1],
    myPred: [2, 1],
    pts: null,
    timeline: [
      {
        min: 12,
        head: "GOL · Hirving Lozano",
        body: "Asistencia de Edson Álvarez tras un tiro de esquina.",
      },
      {
        min: 34,
        head: "AMARILLA · Alphonso Davies",
        body: "Falta táctica en mediocampo.",
      },
      {
        min: 47,
        head: "GOL · Jonathan David",
        body: "Cabezazo tras centro de Buchanan.",
      },
      {
        min: 71,
        head: "GOL · Santiago Giménez",
        body: "Definición cruzada, asistencia de Lozano.",
      },
    ],
  },
  {
    id: "m2",
    state: "live",
    dayLabel: "HOY",
    dateNum: "11",
    monthShort: "JUN",
    weekday: "JUE",
    time: "23'",
    venue: "MetLife Stadium, NJ",
    stage: "Grupo B",
    home: T.B1,
    away: T.B4,
    score: [0, 1],
    myPred: [1, 2],
    pts: null,
  },
  {
    id: "m3",
    state: "pending",
    dayLabel: "HOY",
    dateNum: "11",
    monthShort: "JUN",
    weekday: "JUE",
    time: "20:00",
    kickoffIn: "en 4h 12m",
    venue: "SoFi Stadium, LA",
    stage: "Grupo C",
    home: T.C1,
    away: T.C2,
    myPred: null,
    locked: false,
  },
  {
    id: "m4",
    state: "pending",
    dayLabel: "MAÑANA",
    dateNum: "12",
    monthShort: "JUN",
    weekday: "VIE",
    time: "13:00",
    venue: "BC Place, Vancouver",
    stage: "Grupo D",
    home: T.D1,
    away: T.D4,
    myPred: [2, 0],
    locked: false,
  },
  {
    id: "m5",
    state: "pending",
    dayLabel: "MAÑANA",
    dateNum: "12",
    monthShort: "JUN",
    weekday: "VIE",
    time: "16:00",
    venue: "Estadio Akron, Guad.",
    stage: "Grupo E",
    home: T.E1,
    away: T.E2,
    myPred: null,
  },
  {
    id: "m6",
    state: "pending",
    dayLabel: "MAÑANA",
    dateNum: "12",
    monthShort: "JUN",
    weekday: "VIE",
    time: "19:00",
    venue: "AT&T Stadium, Dallas",
    stage: "Grupo F",
    home: T.F1,
    away: T.F4,
    myPred: [1, 1],
  },
  {
    id: "m7",
    state: "final",
    dayLabel: "AYER",
    dateNum: "10",
    monthShort: "JUN",
    weekday: "MIE",
    time: "FT",
    venue: "Estadio BBVA, Monterrey",
    stage: "Grupo I",
    home: T.I1,
    away: T.I2,
    score: [1, 2],
    myPred: [1, 2],
    pts: 7,
    basePts: 5,
    streakBonus: 2,
    comboBonus: 0,
    streakAt: 2,
    correctOutcome: true,
    correctScore: true,
  },
  {
    id: "m8",
    state: "final",
    dayLabel: "AYER",
    dateNum: "10",
    monthShort: "JUN",
    weekday: "MIE",
    time: "FT",
    venue: "Mercedes-Benz, Atlanta",
    stage: "Grupo J",
    home: T.J1,
    away: T.J3,
    score: [3, 1],
    myPred: [2, 0],
    pts: 1,
    basePts: 1,
    streakBonus: 0,
    comboBonus: 0,
    streakAt: 0,
    correctOutcome: true,
    correctScore: false,
  },
  {
    id: "m9",
    state: "final",
    dayLabel: "AYER",
    dateNum: "10",
    monthShort: "JUN",
    weekday: "MIE",
    time: "FT",
    venue: "Lumen Field, Seattle",
    stage: "Grupo K",
    home: T.K2,
    away: T.K4,
    score: [0, 0],
    myPred: [1, 2],
    pts: 0,
    basePts: 0,
    streakBonus: 0,
    comboBonus: 0,
    streakAt: 0,
    correctOutcome: false,
    correctScore: false,
  },
];

export const MEMBERS: Member[] = [
  {
    id: "u1",
    name: "Tania M.",
    handle: "@tania",
    pts: 287,
    prevRank: 1,
    rank: 1,
    hits: 12,
    streak: 5,
    color: "#00D26A",
    breakdown: {
      exact: 8,
      diff: 4,
      winner: 4,
      streakBonus: 22,
      comboBonus: 30,
      oraclePartial: 25,
    },
  },
  {
    id: "u2",
    name: "Carlos D.",
    handle: "@kdiaz",
    pts: 274,
    prevRank: 3,
    rank: 2,
    hits: 11,
    streak: 2,
    color: "#FF3D71",
    breakdown: {
      exact: 7,
      diff: 3,
      winner: 4,
      streakBonus: 8,
      comboBonus: 20,
      oraclePartial: 25,
    },
  },
  {
    id: "u3",
    name: "Mariana V.",
    handle: "@marivg",
    pts: 268,
    prevRank: 2,
    rank: 3,
    hits: 11,
    streak: 0,
    color: "#FFD60A",
    breakdown: {
      exact: 7,
      diff: 3,
      winner: 4,
      streakBonus: 5,
      comboBonus: 20,
      oraclePartial: 23,
    },
  },
  {
    id: "u4",
    name: "Tú",
    handle: "@you",
    pts: 252,
    prevRank: 7,
    rank: 4,
    hits: 10,
    streak: 3,
    color: "#08F7FE",
    me: true,
    breakdown: {
      exact: 6,
      diff: 4,
      winner: 4,
      streakBonus: 12,
      comboBonus: 10,
      oraclePartial: 22,
    },
  },
  {
    id: "u5",
    name: "Pablo R.",
    handle: "@prios",
    pts: 241,
    prevRank: 4,
    rank: 5,
    hits: 9,
    streak: 0,
    color: "#7C3AED",
    breakdown: {
      exact: 6,
      diff: 3,
      winner: 3,
      streakBonus: 4,
      comboBonus: 10,
      oraclePartial: 20,
    },
  },
  {
    id: "u6",
    name: "Lucía F.",
    handle: "@lucy",
    pts: 233,
    prevRank: 5,
    rank: 6,
    hits: 9,
    streak: 1,
    color: "#FB7185",
    breakdown: {
      exact: 6,
      diff: 3,
      winner: 3,
      streakBonus: 3,
      comboBonus: 10,
      oraclePartial: 18,
    },
  },
  {
    id: "u7",
    name: "Diego A.",
    handle: "@deigo",
    pts: 224,
    prevRank: 6,
    rank: 7,
    hits: 8,
    streak: 0,
    color: "#34D399",
    breakdown: {
      exact: 5,
      diff: 3,
      winner: 3,
      streakBonus: 2,
      comboBonus: 10,
      oraclePartial: 17,
    },
  },
  {
    id: "u8",
    name: "Valentina O.",
    handle: "@valeo",
    pts: 210,
    prevRank: 8,
    rank: 8,
    hits: 8,
    streak: 0,
    color: "#F59E0B",
    breakdown: {
      exact: 5,
      diff: 2,
      winner: 3,
      streakBonus: 2,
      comboBonus: 0,
      oraclePartial: 16,
    },
  },
  {
    id: "u9",
    name: "Sofía B.",
    handle: "@sofb",
    pts: 198,
    prevRank: 11,
    rank: 9,
    hits: 7,
    streak: 2,
    color: "#A78BFA",
    breakdown: {
      exact: 4,
      diff: 3,
      winner: 2,
      streakBonus: 4,
      comboBonus: 0,
      oraclePartial: 15,
    },
  },
  {
    id: "u10",
    name: "Andrés P.",
    handle: "@andp",
    pts: 187,
    prevRank: 9,
    rank: 10,
    hits: 7,
    streak: 0,
    color: "#22D3EE",
    breakdown: {
      exact: 4,
      diff: 2,
      winner: 3,
      streakBonus: 1,
      comboBonus: 0,
      oraclePartial: 14,
    },
  },
  {
    id: "u11",
    name: "Gabriela L.",
    handle: "@gabl",
    pts: 172,
    prevRank: 10,
    rank: 11,
    hits: 6,
    streak: 0,
    color: "#F472B6",
    breakdown: {
      exact: 3,
      diff: 2,
      winner: 3,
      streakBonus: 1,
      comboBonus: 0,
      oraclePartial: 12,
    },
  },
  {
    id: "u12",
    name: "Roberto T.",
    handle: "@robt",
    pts: 145,
    prevRank: 12,
    rank: 12,
    hits: 5,
    streak: 0,
    color: "#94A3B8",
    breakdown: {
      exact: 2,
      diff: 2,
      winner: 3,
      streakBonus: 0,
      comboBonus: 0,
      oraclePartial: 10,
    },
  },
];

export const SCORING_RULES: ScoringRules = {
  exact: 5,
  diff: 3,
  winner: 1,
  streakStep: 1,
  streakMax: 5,
  combo: 10,
  oracleChampion: 50,
};

export const BRACKET: Record<string, BracketSlot[]> = {
  r32: [
    { id: "r32-1", top: "A1", bot: "B2", picked: "A1" },
    { id: "r32-2", top: "C1", bot: "F2", picked: "C1" },
    { id: "r32-3", top: "E1", bot: "D2", picked: "E1" },
    { id: "r32-4", top: "G1", bot: "H2", picked: "G1" },
    { id: "r32-5", top: "I1", bot: "J2", picked: null },
    { id: "r32-6", top: "K1", bot: "L2", picked: null },
    { id: "r32-7", top: "B1", bot: "A2", picked: "B1" },
    { id: "r32-8", top: "D1", bot: "E2", picked: "D1" },
  ],
  r16: [
    { id: "r16-1", top: "A1", bot: "C1", picked: "A1" },
    { id: "r16-2", top: "E1", bot: "G1", picked: "G1" },
    { id: "r16-3", top: null, bot: null, picked: null },
    { id: "r16-4", top: "B1", bot: "D1", picked: null },
  ],
  qf: [
    { id: "qf-1", top: "A1", bot: "G1", picked: "A1" },
    { id: "qf-2", top: null, bot: null, picked: null },
  ],
  sf: [{ id: "sf-1", top: "A1", bot: null, picked: null }],
  f: [{ id: "f-1", top: null, bot: null, picked: null }],
};

export const ROUND_LABELS: RoundLabel[] = [
  { key: "r32", label: "Dieciseisavos", short: "1/16", count: "8 / 16" },
  { key: "r16", label: "Octavos", short: "1/8", count: "4 / 8" },
  { key: "qf", label: "Cuartos", short: "QF", count: "1 / 4" },
  { key: "sf", label: "Semifinal", short: "SF", count: "0 / 2" },
  { key: "f", label: "Final", short: "F", count: "0 / 1" },
];

export const BADGES: Badge[] = [
  { id: "b1", num: "5×", label: "Racha", unlocked: true },
  { id: "b2", num: "1°", label: "Primer hit", unlocked: true },
  { id: "b3", num: "10", label: "Diez aciertos", unlocked: true },
  { id: "b4", num: "5/5", label: "Pleno jornada", unlocked: true },
  { id: "b5", num: "🏟", label: "Día partido", unlocked: true },
  { id: "b6", num: "★", label: "Top 3 semanal", unlocked: false },
  { id: "b7", num: "K.O.", label: "Ko maestro", unlocked: false },
  { id: "b8", num: "👑", label: "Oráculo", unlocked: false },
];
