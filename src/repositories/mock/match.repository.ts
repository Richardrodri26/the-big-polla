import type { IMatchRepository } from '@/repositories/interfaces'
import type { Match, MatchState } from '@/types/domain'

function kickoffAt(dayOffset: number, hour: number, minute: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const MOCK_MATCHES: Match[] = [
  // ── HOY · live ────────────────────────────────────────────────────────────
  {
    id: 'm1',
    state: 'live',
    kickoffAt: kickoffAt(0, 10, 0),
    liveMinute: 78,
    venue: 'Estadio Azteca, CDMX',
    stage: 'Grupo A',
    home: { code: 'MEX', name: 'México', c1: '#006847', c2: '#CE1126' },
    away: { code: 'CAN', name: 'Canadá', c1: '#D80027', c2: '#FFFFFF' },
    locked: true,
    score: [2, 1],
    userPrediction: [2, 1],
    timeline: [
      { min: 12, head: 'GOL · Hirving Lozano', body: 'Asistencia de Edson Álvarez tras un tiro de esquina.' },
      { min: 34, head: 'AMARILLA · Alphonso Davies', body: 'Falta táctica en mediocampo.' },
      { min: 47, head: 'GOL · Jonathan David', body: 'Cabezazo tras centro de Buchanan.' },
      { min: 71, head: 'GOL · Santiago Giménez', body: 'Definición cruzada, asistencia de Lozano.' },
    ],
  },
  {
    id: 'm2',
    state: 'live',
    kickoffAt: kickoffAt(0, 12, 0),
    liveMinute: 23,
    venue: 'MetLife Stadium, NJ',
    stage: 'Grupo B',
    home: { code: 'USA', name: 'Estados Unidos', c1: '#0A3161', c2: '#B31942' },
    away: { code: 'POR', name: 'Portugal', c1: '#006600', c2: '#FF0000' },
    locked: true,
    score: [0, 1],
    userPrediction: [1, 2],
  },
  // ── HOY · pending ─────────────────────────────────────────────────────────
  {
    id: 'm3',
    state: 'pending',
    kickoffAt: kickoffAt(0, 20, 0),
    venue: 'SoFi Stadium, LA',
    stage: 'Grupo C',
    home: { code: 'ARG', name: 'Argentina', c1: '#74ACDF', c2: '#FFFFFF' },
    away: { code: 'POL', name: 'Polonia', c1: '#DC143C', c2: '#FFFFFF' },
    locked: false,
    userPrediction: null,
  },
  // ── MAÑANA · pending ──────────────────────────────────────────────────────
  {
    id: 'm4',
    state: 'pending',
    kickoffAt: kickoffAt(1, 13, 0),
    venue: 'BC Place, Vancouver',
    stage: 'Grupo D',
    home: { code: 'FRA', name: 'Francia', c1: '#0055A4', c2: '#EF4135' },
    away: { code: 'MAR', name: 'Marruecos', c1: '#C1272D', c2: '#006233' },
    locked: false,
    userPrediction: [2, 0],
  },
  {
    id: 'm5',
    state: 'pending',
    kickoffAt: kickoffAt(1, 16, 0),
    venue: 'Estadio Akron, Guad.',
    stage: 'Grupo E',
    home: { code: 'ESP', name: 'España', c1: '#AA151B', c2: '#F1BF00' },
    away: { code: 'GER', name: 'Alemania', c1: '#000000', c2: '#FFCE00' },
    locked: false,
    userPrediction: null,
  },
  {
    id: 'm6',
    state: 'pending',
    kickoffAt: kickoffAt(1, 19, 0),
    venue: 'AT&T Stadium, Dallas',
    stage: 'Grupo F',
    home: { code: 'BEL', name: 'Bélgica', c1: '#000000', c2: '#FFD90C' },
    away: { code: 'BRA', name: 'Brasil', c1: '#009C3B', c2: '#FFDF00' },
    locked: false,
    userPrediction: [1, 1],
  },
  // ── AYER · final ──────────────────────────────────────────────────────────
  {
    id: 'm7',
    state: 'final',
    kickoffAt: kickoffAt(-1, 20, 0),
    venue: 'Estadio BBVA, Monterrey',
    stage: 'Grupo I',
    home: { code: 'ITA', name: 'Italia', c1: '#009246', c2: '#CE2B37' },
    away: { code: 'NED', name: 'Países Bajos', c1: '#AE1C28', c2: '#21468B' },
    locked: true,
    score: [1, 2],
    userPrediction: [1, 2],
    pts: 7,
    basePts: 5,
    streakBonus: 2,
    correctOutcome: true,
    correctScore: true,
  },
  {
    id: 'm8',
    state: 'final',
    kickoffAt: kickoffAt(-1, 17, 0),
    venue: 'Mercedes-Benz Stadium, Atlanta',
    stage: 'Grupo J',
    home: { code: 'ENG', name: 'Inglaterra', c1: '#FFFFFF', c2: '#CE1124' },
    away: { code: 'SEN', name: 'Senegal', c1: '#00853F', c2: '#FDEF42' },
    locked: true,
    score: [3, 1],
    userPrediction: [2, 0],
    pts: 1,
    basePts: 1,
    streakBonus: 0,
    correctOutcome: true,
    correctScore: false,
  },
  {
    id: 'm9',
    state: 'final',
    kickoffAt: kickoffAt(-1, 14, 0),
    venue: 'Lumen Field, Seattle',
    stage: 'Grupo K',
    home: { code: 'TUR', name: 'Turquía', c1: '#E30A17', c2: '#FFFFFF' },
    away: { code: 'ALG', name: 'Argelia', c1: '#006233', c2: '#FFFFFF' },
    locked: true,
    score: [0, 0],
    userPrediction: [1, 2],
    pts: 0,
    basePts: 0,
    streakBonus: 0,
    correctOutcome: false,
    correctScore: false,
  },
]

export class MockMatchRepository implements IMatchRepository {
  async getMatches(filters?: { state?: MatchState }): Promise<Match[]> {
    if (filters?.state) {
      return MOCK_MATCHES.filter(m => m.state === filters.state)
    }
    return MOCK_MATCHES
  }

  async getMatch(id: string): Promise<Match | null> {
    return MOCK_MATCHES.find(m => m.id === id) ?? null
  }
}
