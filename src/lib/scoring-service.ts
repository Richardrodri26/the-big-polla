import { prisma } from '@/lib/prisma'
import { calculatePoints, calculateStreakBonus } from '@/lib/scoring'

export class ScoringService {
  async scoreMatch(matchId: string): Promise<void> {
    const match = await prisma.match.findUnique({ where: { id: matchId } })

    if (!match || match.state !== 'FINAL') {
      throw new Error(`Match ${matchId} is not FINAL`)
    }
    if (match.homeScore === null || match.awayScore === null) {
      throw new Error(`Match ${matchId} has no result`)
    }

    const result = { home: match.homeScore, away: match.awayScore }

    await prisma.$transaction(async (tx) => {
      // 1. Obtener todas las predicciones para este partido
      const predictions = await tx.prediction.findMany({
        where: { matchId },
        include: { user: { select: { id: true, name: true, handle: true } } },
      })

      // 2. Obtener todas las ligas que tienen estos usuarios
      const userIds = predictions.map(p => p.userId)
      const memberships = await tx.leagueMember.findMany({
        where: { userId: { in: userIds } },
      })

      // Agrupar memberships por usuario
      const userLeagues = new Map<string, string[]>()
      for (const m of memberships) {
        const existing = userLeagues.get(m.userId) ?? []
        userLeagues.set(m.userId, [...existing, m.leagueId])
      }

      // 3. Calcular puntos para cada predicción
      for (const prediction of predictions) {
        const breakdown = calculatePoints(
          { home: prediction.homeScore, away: prediction.awayScore },
          result,
          match.stage
        )

        const leagueIds = userLeagues.get(prediction.userId) ?? []

        for (const leagueId of leagueIds) {
          // 4. Obtener historial de hits para calcular racha
          const priorLogs = await tx.scoreLog.findMany({
            where: {
              score: { userId: prediction.userId, leagueId },
              matchId: { not: matchId },
            },
            orderBy: { createdAt: 'asc' },
          })

          const hitHistory = priorLogs.map(log => log.pts > 0)
          const currentStreakBonus = calculateStreakBonus([...hitHistory, breakdown.total > 0])

          // Bonus incremental = nuevo valor de racha - valor anterior
          const previousStreakBonus = calculateStreakBonus(hitHistory)
          const streakBonusDelta = currentStreakBonus - previousStreakBonus

          const totalPts = breakdown.total + streakBonusDelta

          // 5. Upsert Score acumulado
          await tx.score.upsert({
            where: { userId_leagueId: { userId: prediction.userId, leagueId } },
            update: {
              pts: { increment: totalPts },
              hits: { increment: breakdown.total > 0 ? 1 : 0 },
              streak: breakdown.total > 0 ? { increment: 1 } : 0,
            },
            create: {
              userId: prediction.userId,
              leagueId,
              pts: totalPts,
              hits: breakdown.total > 0 ? 1 : 0,
              streak: breakdown.total > 0 ? 1 : 0,
              rank: 0,
              prevRank: 0,
              breakdown: {},
            },
          })

          // 6. Crear ScoreLog para trazabilidad
          await tx.scoreLog.create({
            data: {
              score: {
                connect: { userId_leagueId: { userId: prediction.userId, leagueId } },
              },
              matchId,
              pts: totalPts,
              type: streakBonusDelta > 0 ? 'match+streak' : 'match',
              detail: {
                winner: breakdown.winner,
                goalsHome: breakdown.goalsHome,
                goalsAway: breakdown.goalsAway,
                diff: breakdown.diff,
                streakBonus: streakBonusDelta,
                prediction: { home: prediction.homeScore, away: prediction.awayScore },
                result: { home: result.home, away: result.away },
              },
            },
          })
        }
      }

      // 7. Recalcular rankings por liga (ordenar por pts desc)
      const affectedLeagueIds = [...new Set(memberships.map(m => m.leagueId))]
      for (const leagueId of affectedLeagueIds) {
        const scores = await tx.score.findMany({
          where: { leagueId },
          orderBy: { pts: 'desc' },
        })

        for (let i = 0; i < scores.length; i++) {
          await tx.score.update({
            where: { id: scores[i].id },
            data: { prevRank: scores[i].rank, rank: i + 1 },
          })
        }
      }
    })
  }
}
