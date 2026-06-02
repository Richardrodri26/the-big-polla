export interface ScoreBreakdown {
  winner: number      // puntos por resultado correcto
  goalsHome: number   // puntos por goles locales exactos
  goalsAway: number   // puntos por goles visitante exactos
  diff: number        // puntos por diferencia de goles exacta
  total: number
}

export function isEliminationStage(stage: string): boolean {
  return !stage.startsWith('Grupo')
}

export function calculatePoints(
  prediction: { home: number; away: number },
  result: { home: number; away: number },
  stage: string
): ScoreBreakdown {
  const multiplier = isEliminationStage(stage) ? 2 : 1

  const predWinner = Math.sign(prediction.home - prediction.away)
  const realWinner = Math.sign(result.home - result.away)

  const winner = predWinner === realWinner ? 5 * multiplier : 0
  const goalsHome = prediction.home === result.home ? 2 * multiplier : 0
  const goalsAway = prediction.away === result.away ? 2 * multiplier : 0

  const predDiff = prediction.home - prediction.away
  const realDiff = result.home - result.away
  const diff = predDiff === realDiff ? 1 * multiplier : 0

  return {
    winner,
    goalsHome,
    goalsAway,
    diff,
    total: winner + goalsHome + goalsAway + diff,
  }
}
