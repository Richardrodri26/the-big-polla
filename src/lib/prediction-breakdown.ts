export interface PredictionBreakdown {
  homeWin: number
  draw: number
  awayWin: number
  total: number
}

export function computePredictionBreakdown(
  preds: { homeScore: number; awayScore: number }[],
): PredictionBreakdown | null {
  const total = preds.length
  if (total === 0) return null
  const homeWin = Math.round(
    (preds.filter(p => p.homeScore > p.awayScore).length / total) * 100,
  )
  const draw = Math.round(
    (preds.filter(p => p.homeScore === p.awayScore).length / total) * 100,
  )
  const awayWin = Math.round(
    (preds.filter(p => p.homeScore < p.awayScore).length / total) * 100,
  )
  return { homeWin, draw, awayWin, total }
}
