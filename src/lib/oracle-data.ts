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

// R32 matchups — FIFA 2026 WC official bracket (matches 73–88)
// bot: null = mejor tercero TBD al terminar fase de grupos
export const BRACKET: Record<string, BracketSlot[]> = {
  r32: [
    { id: 'r32-1',  top: 'A2', bot: 'B2',  picked: null },
    { id: 'r32-2',  top: 'E1', bot: null,   picked: null },
    { id: 'r32-3',  top: 'F1', bot: 'C2',  picked: null },
    { id: 'r32-4',  top: 'C1', bot: 'F2',  picked: null },
    { id: 'r32-5',  top: 'I1', bot: null,   picked: null },
    { id: 'r32-6',  top: 'E2', bot: 'I2',  picked: null },
    { id: 'r32-7',  top: 'A1', bot: null,   picked: null },
    { id: 'r32-8',  top: 'L1', bot: null,   picked: null },
    { id: 'r32-9',  top: 'D1', bot: null,   picked: null },
    { id: 'r32-10', top: 'G1', bot: null,   picked: null },
    { id: 'r32-11', top: 'K2', bot: 'L2',  picked: null },
    { id: 'r32-12', top: 'H1', bot: 'J2',  picked: null },
    { id: 'r32-13', top: 'B1', bot: null,   picked: null },
    { id: 'r32-14', top: 'J1', bot: 'H2',  picked: null },
    { id: 'r32-15', top: 'K1', bot: null,   picked: null },
    { id: 'r32-16', top: 'D2', bot: 'G2',  picked: null },
  ],
  r16: [
    { id: 'r16-1', top: null, bot: null, picked: null },
    { id: 'r16-2', top: null, bot: null, picked: null },
    { id: 'r16-3', top: null, bot: null, picked: null },
    { id: 'r16-4', top: null, bot: null, picked: null },
    { id: 'r16-5', top: null, bot: null, picked: null },
    { id: 'r16-6', top: null, bot: null, picked: null },
    { id: 'r16-7', top: null, bot: null, picked: null },
    { id: 'r16-8', top: null, bot: null, picked: null },
  ],
  qf: [
    { id: 'qf-1', top: null, bot: null, picked: null },
    { id: 'qf-2', top: null, bot: null, picked: null },
    { id: 'qf-3', top: null, bot: null, picked: null },
    { id: 'qf-4', top: null, bot: null, picked: null },
  ],
  sf: [
    { id: 'sf-1', top: null, bot: null, picked: null },
    { id: 'sf-2', top: null, bot: null, picked: null },
  ],
  f: [{ id: 'f-1', top: null, bot: null, picked: null }],
}

export const ROUND_LABELS: RoundLabel[] = [
  { key: 'r32', label: 'Dieciseisavos', short: 'R32', count: '0 / 16' },
  { key: 'r16', label: 'Octavos',       short: 'R16', count: '0 / 8'  },
  { key: 'qf',  label: 'Cuartos',       short: 'QF',  count: '0 / 4'  },
  { key: 'sf',  label: 'Semifinal',     short: 'SF',  count: '0 / 2'  },
  { key: 'f',   label: 'Final',         short: 'F',   count: '0 / 1'  },
]
