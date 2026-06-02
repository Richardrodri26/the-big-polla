import { describe, expect, it } from 'vitest'
import { calculatePoints, isEliminationStage } from '@/lib/scoring'

describe('isEliminationStage', () => {
  it('returns false for group stages', () => {
    expect(isEliminationStage('Grupo A')).toBe(false)
    expect(isEliminationStage('Grupo H')).toBe(false)
  })

  it('returns true for knockout stages', () => {
    expect(isEliminationStage('Octavos')).toBe(true)
    expect(isEliminationStage('Cuartos')).toBe(true)
    expect(isEliminationStage('Semifinal')).toBe(true)
    expect(isEliminationStage('Final')).toBe(true)
  })
})

describe('calculatePoints', () => {
  // ── Fase de grupos ──────────────────────────────────────────────────────
  describe('group stage', () => {
    it('awards 5 pts for correct winner prediction', () => {
      const pts = calculatePoints({ home: 2, away: 0 }, { home: 4, away: 1 }, 'Grupo A')
      expect(pts.winner).toBe(5)
      expect(pts.goalsHome).toBe(0)
      expect(pts.goalsAway).toBe(0)
      expect(pts.diff).toBe(0)
      expect(pts.total).toBe(5)
    })

    it('awards 5 pts for correct draw prediction', () => {
      const pts = calculatePoints({ home: 1, away: 1 }, { home: 2, away: 2 }, 'Grupo B')
      expect(pts.winner).toBe(5)
      expect(pts.total).toBe(6) // diff exacto (0-0) siempre suma 1 pt en cualquier empate vs empate
    })

    it('awards 0 pts for wrong winner', () => {
      const pts = calculatePoints({ home: 2, away: 0 }, { home: 0, away: 1 }, 'Grupo A')
      expect(pts.winner).toBe(0)
      expect(pts.total).toBe(0)
    })

    it('awards 2 pts per exact goal scored', () => {
      const pts = calculatePoints({ home: 2, away: 1 }, { home: 2, away: 1 }, 'Grupo A')
      expect(pts.winner).toBe(5)
      expect(pts.goalsHome).toBe(2)
      expect(pts.goalsAway).toBe(2)
      expect(pts.diff).toBe(1)
      expect(pts.total).toBe(10) // 5 + 2 + 2 + 1
    })

    it('awards 2 pts for only home goals exact', () => {
      const pts = calculatePoints({ home: 2, away: 3 }, { home: 2, away: 1 }, 'Grupo A')
      expect(pts.goalsHome).toBe(2)
      expect(pts.goalsAway).toBe(0)
    })

    it('awards 1 pt for exact goal difference', () => {
      const pts = calculatePoints({ home: 3, away: 1 }, { home: 2, away: 0 }, 'Grupo C')
      expect(pts.winner).toBe(5)
      expect(pts.diff).toBe(1)
      expect(pts.goalsHome).toBe(0)
      expect(pts.goalsAway).toBe(0)
      expect(pts.total).toBe(6)
    })

    it('awards 0 diff pts when goal difference differs', () => {
      const pts = calculatePoints({ home: 3, away: 0 }, { home: 2, away: 0 }, 'Grupo A')
      expect(pts.diff).toBe(0)
    })
  })

  // ── Eliminación directa ──────────────────────────────────────────────────
  describe('knockout stage', () => {
    it('doubles all base points in knockout stage', () => {
      // Exact score prediction in knockout
      const pts = calculatePoints({ home: 2, away: 1 }, { home: 2, away: 1 }, 'Cuartos')
      expect(pts.winner).toBe(10)
      expect(pts.goalsHome).toBe(4)
      expect(pts.goalsAway).toBe(4)
      expect(pts.diff).toBe(2)
      expect(pts.total).toBe(20)
    })

    it('awards 10 pts for correct winner in knockout', () => {
      const pts = calculatePoints({ home: 1, away: 0 }, { home: 3, away: 1 }, 'Semifinal')
      expect(pts.winner).toBe(10)
      expect(pts.total).toBe(10)
    })
  })

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('returns zero total when no points earned', () => {
      const pts = calculatePoints({ home: 0, away: 0 }, { home: 1, away: 2 }, 'Grupo A')
      expect(pts.total).toBe(0)
    })

    it('correctly identifies 0-0 draw as draw result', () => {
      const pts = calculatePoints({ home: 0, away: 0 }, { home: 0, away: 0 }, 'Grupo A')
      expect(pts.winner).toBe(5)
      expect(pts.goalsHome).toBe(2)
      expect(pts.goalsAway).toBe(2)
      expect(pts.diff).toBe(1)
    })
  })
})
