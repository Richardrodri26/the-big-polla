import { prisma } from '@/lib/prisma'

function startOfISOWeek(): Date {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day // back to Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export async function getWeeklyPts(userId: string, leagueId: string): Promise<number> {
  const logs = await prisma.scoreLog.findMany({
    where: {
      createdAt: { gte: startOfISOWeek() },
      score: { userId, leagueId },
    },
    select: { pts: true },
  })
  return logs.reduce((sum, l) => sum + l.pts, 0)
}
