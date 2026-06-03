import { describe, it, expect } from 'vitest'
import { computePredictionBreakdown } from '@/lib/prediction-breakdown'

describe('computePredictionBreakdown', () => {
  it('returns null for empty array', () => {
    expect(computePredictionBreakdown([])).toBeNull()
  })

  it('counts home wins, draws, away wins correctly', () => {
    const preds = [
      { homeScore: 2, awayScore: 0 },
      { homeScore: 1, awayScore: 0 },
      { homeScore: 0, awayScore: 1 },
      { homeScore: 1, awayScore: 1 },
    ]
    const result = computePredictionBreakdown(preds)
    expect(result?.homeWin).toBe(50)  // 2/4
    expect(result?.awayWin).toBe(25)  // 1/4
    expect(result?.draw).toBe(25)     // 1/4
    expect(result?.total).toBe(4)
  })

  it('rounds fractional percentages to nearest integer', () => {
    const preds = [
      { homeScore: 2, awayScore: 0 },
      { homeScore: 2, awayScore: 0 },
      { homeScore: 0, awayScore: 1 },
    ]
    const result = computePredictionBreakdown(preds)
    expect(result?.homeWin).toBe(67)  // 66.7 → 67
    expect(result?.awayWin).toBe(33)  // 33.3 → 33
    expect(result?.draw).toBe(0)
  })
})
