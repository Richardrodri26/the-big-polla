import type { Team } from '@/types/domain'

export interface BracketSlot {
  id: string
  top: string | null
  bot: string | null
  picked: string | null
}

export interface RoundLabel {
  key: string
  label: string
  short: string
  count: string
}

export type OracleTeam = Team & { group: string; seed: number; key: string }

const GROUPS: Record<string, Team[]> = {
  A: [
    { code: 'MEX', name: 'México', c1: '#006847', c2: '#CE1126' },
    { code: 'CAN', name: 'Canadá', c1: '#D80027', c2: '#FFFFFF' },
    { code: 'ECU', name: 'Ecuador', c1: '#FFCE00', c2: '#0033A0' },
    { code: 'URU', name: 'Uruguay', c1: '#5CBFEB', c2: '#FFFFFF' },
  ],
  B: [
    { code: 'USA', name: 'Estados Unidos', c1: '#0A3161', c2: '#B31942' },
    { code: 'WAL', name: 'Gales', c1: '#C8102E', c2: '#00B140' },
    { code: 'IRN', name: 'Irán', c1: '#239F40', c2: '#DA0000' },
    { code: 'POR', name: 'Portugal', c1: '#006600', c2: '#FF0000' },
  ],
  C: [
    { code: 'ARG', name: 'Argentina', c1: '#74ACDF', c2: '#FFFFFF' },
    { code: 'POL', name: 'Polonia', c1: '#DC143C', c2: '#FFFFFF' },
    { code: 'KSA', name: 'Arabia Saudita', c1: '#006C35', c2: '#FFFFFF' },
    { code: 'AUS', name: 'Australia', c1: '#012169', c2: '#FFCD00' },
  ],
  D: [
    { code: 'FRA', name: 'Francia', c1: '#0055A4', c2: '#EF4135' },
    { code: 'DEN', name: 'Dinamarca', c1: '#C8102E', c2: '#FFFFFF' },
    { code: 'TUN', name: 'Túnez', c1: '#E70013', c2: '#FFFFFF' },
    { code: 'MAR', name: 'Marruecos', c1: '#C1272D', c2: '#006233' },
  ],
  E: [
    { code: 'ESP', name: 'España', c1: '#AA151B', c2: '#F1BF00' },
    { code: 'GER', name: 'Alemania', c1: '#000000', c2: '#FFCE00' },
    { code: 'JPN', name: 'Japón', c1: '#BC002D', c2: '#FFFFFF' },
    { code: 'CRC', name: 'Costa Rica', c1: '#002B7F', c2: '#CE1126' },
  ],
  F: [
    { code: 'BEL', name: 'Bélgica', c1: '#000000', c2: '#FFD90C' },
    { code: 'CRO', name: 'Croacia', c1: '#171796', c2: '#FF0000' },
    { code: 'CMR', name: 'Camerún', c1: '#007A5E', c2: '#CE1126' },
    { code: 'BRA', name: 'Brasil', c1: '#009C3B', c2: '#FFDF00' },
  ],
  G: [
    { code: 'BRA', name: 'Brasil', c1: '#009C3B', c2: '#FFDF00' },
    { code: 'SUI', name: 'Suiza', c1: '#FF0000', c2: '#FFFFFF' },
    { code: 'SRB', name: 'Serbia', c1: '#C6363C', c2: '#0C4076' },
    { code: 'GHA', name: 'Ghana', c1: '#CE1126', c2: '#FCD116' },
  ],
  H: [
    { code: 'POR', name: 'Portugal', c1: '#006600', c2: '#FF0000' },
    { code: 'URU', name: 'Uruguay', c1: '#5CBFEB', c2: '#FFFFFF' },
    { code: 'KOR', name: 'Corea del Sur', c1: '#0047A0', c2: '#CD2E3A' },
    { code: 'GHA', name: 'Ghana', c1: '#CE1126', c2: '#FCD116' },
  ],
  I: [
    { code: 'ITA', name: 'Italia', c1: '#009246', c2: '#CE2B37' },
    { code: 'NED', name: 'Países Bajos', c1: '#AE1C28', c2: '#21468B' },
    { code: 'EGY', name: 'Egipto', c1: '#CE1126', c2: '#000000' },
    { code: 'PAR', name: 'Paraguay', c1: '#D52B1E', c2: '#0038A8' },
  ],
  J: [
    { code: 'ENG', name: 'Inglaterra', c1: '#FFFFFF', c2: '#CE1124' },
    { code: 'COL', name: 'Colombia', c1: '#FCD116', c2: '#003893' },
    { code: 'SEN', name: 'Senegal', c1: '#00853F', c2: '#FDEF42' },
    { code: 'CHI', name: 'Chile', c1: '#D52B1E', c2: '#0039A6' },
  ],
  K: [
    { code: 'NGA', name: 'Nigeria', c1: '#008751', c2: '#FFFFFF' },
    { code: 'TUR', name: 'Turquía', c1: '#E30A17', c2: '#FFFFFF' },
    { code: 'PER', name: 'Perú', c1: '#D91023', c2: '#FFFFFF' },
    { code: 'ALG', name: 'Argelia', c1: '#006233', c2: '#FFFFFF' },
  ],
  L: [
    { code: 'SCO', name: 'Escocia', c1: '#0065BD', c2: '#FFFFFF' },
    { code: 'VEN', name: 'Venezuela', c1: '#FCD116', c2: '#CF142B' },
    { code: 'AUT', name: 'Austria', c1: '#ED2939', c2: '#FFFFFF' },
    { code: 'QAT', name: 'Catar', c1: '#8A1538', c2: '#FFFFFF' },
  ],
}

export const ALL_GROUPS = GROUPS

export const TEAMS: Record<string, OracleTeam> = {}
Object.entries(GROUPS).forEach(([g, teams]) => {
  teams.forEach((t, i) => {
    const key = `${g}${i + 1}`
    TEAMS[key] = { ...t, group: g, seed: i + 1, key }
  })
})

export const BRACKET: Record<string, BracketSlot[]> = {
  r32: [
    { id: 'r32-1', top: 'A1', bot: 'B2', picked: 'A1' },
    { id: 'r32-2', top: 'C1', bot: 'F2', picked: 'C1' },
    { id: 'r32-3', top: 'E1', bot: 'D2', picked: 'E1' },
    { id: 'r32-4', top: 'G1', bot: 'H2', picked: 'G1' },
    { id: 'r32-5', top: 'I1', bot: 'J2', picked: null },
    { id: 'r32-6', top: 'K1', bot: 'L2', picked: null },
    { id: 'r32-7', top: 'B1', bot: 'A2', picked: 'B1' },
    { id: 'r32-8', top: 'D1', bot: 'E2', picked: 'D1' },
  ],
  r16: [
    { id: 'r16-1', top: 'A1', bot: 'C1', picked: 'A1' },
    { id: 'r16-2', top: 'E1', bot: 'G1', picked: 'G1' },
    { id: 'r16-3', top: null, bot: null, picked: null },
    { id: 'r16-4', top: 'B1', bot: 'D1', picked: null },
  ],
  qf: [
    { id: 'qf-1', top: 'A1', bot: 'G1', picked: 'A1' },
    { id: 'qf-2', top: null, bot: null, picked: null },
  ],
  sf: [{ id: 'sf-1', top: 'A1', bot: null, picked: null }],
  f: [{ id: 'f-1', top: null, bot: null, picked: null }],
}

export const ROUND_LABELS: RoundLabel[] = [
  { key: 'r32', label: 'Dieciseisavos', short: '1/16', count: '8 / 16' },
  { key: 'r16', label: 'Octavos', short: '1/8', count: '4 / 8' },
  { key: 'qf', label: 'Cuartos', short: 'QF', count: '1 / 4' },
  { key: 'sf', label: 'Semifinal', short: 'SF', count: '0 / 2' },
  { key: 'f', label: 'Final', short: 'F', count: '0 / 1' },
]
