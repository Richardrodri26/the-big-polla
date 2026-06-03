import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getLeagueRepository, getMatchRepository } from '@/repositories'
import { ProfileScreen } from './profile-screen'
import { PredictionHistoryList } from './prediction-history-list'
import type { PredictionHistoryItem } from '@/types/domain'

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id

  const [matches, members, badges] = await Promise.all([
    getMatchRepository().getMatches({ state: 'final' }),
    getLeagueRepository(userId).getMembers('default'),
    getLeagueRepository(userId).getBadges(userId ?? 'me'),
  ])

  const me = members.find(m => m.me)
  if (!me) throw new Error('Current user not found in members')

  let initialHistory: PredictionHistoryItem[] = []
  let initialNextCursor: string | null = null
  let leagueId: string | undefined

  if (userId) {
    const userLeagues = await prisma.leagueMember.findFirst({
      where: { userId },
      select: { leagueId: true },
      orderBy: { joinedAt: 'asc' },
    })
    leagueId = userLeagues?.leagueId

    const predictions = await prisma.prediction.findMany({
      where: { userId },
      orderBy: { savedAt: 'desc' },
      take: 11,
      include: { match: true },
    })

    const hasMore = predictions.length > 10
    const items = predictions.slice(0, 10)

    const scoreLogs = leagueId
      ? await prisma.scoreLog.findMany({
          where: {
            score: { userId, leagueId },
            matchId: { in: items.map(p => p.matchId) },
          },
        })
      : []

    const scoreLogMap = new Map(scoreLogs.map(l => [l.matchId, l]))

    initialHistory = items.map(p => {
      const m = p.match
      const log = scoreLogMap.get(p.matchId)
      const detail = log?.detail as Record<string, number> | null

      return {
        matchId: p.matchId,
        kickoffAt: m.kickoffAt.toISOString(),
        stage: m.stage,
        home: { code: m.homeTeamCode, name: m.homeTeamName, c1: m.homeTeamC1, c2: m.homeTeamC2 },
        away: { code: m.awayTeamCode, name: m.awayTeamName, c1: m.awayTeamC1, c2: m.awayTeamC2 },
        result: m.homeScore !== null && m.awayScore !== null ? [m.homeScore, m.awayScore] : null,
        prediction: [p.homeScore, p.awayScore],
        pts: log?.pts ?? 0,
        scoreLog: detail
          ? {
              winner: detail.winner ?? 0,
              goalsHome: detail.goalsHome ?? 0,
              goalsAway: detail.goalsAway ?? 0,
              diff: detail.diff ?? 0,
              streakBonus: detail.streakBonus ?? 0,
            }
          : null,
      }
    })

    initialNextCursor = hasMore ? items[items.length - 1].id : null
  }

  const historySection = (
    <PredictionHistoryList
      initialItems={initialHistory}
      initialNextCursor={initialNextCursor}
      leagueId={leagueId}
    />
  )

  return (
    <ProfileScreen
      me={me}
      members={members}
      finishedMatches={matches}
      badges={badges}
      scoreLogs={[]}
      historySection={historySection}
    />
  )
}
