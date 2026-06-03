import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getLeagueRepository } from '@/repositories'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const membership = await prisma.leagueMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
    select: { leagueId: true },
  })

  if (!membership) {
    return NextResponse.json({
      user: { name: session.user.name ?? session.user.email ?? 'Tú', color: '#08F7FE', rank: null, pts: 0 },
      league: null,
    })
  }

  const leagueId = membership.leagueId

  const [league, members] = await Promise.all([
    prisma.league.findUnique({ where: { id: leagueId }, select: { name: true, id: true } }),
    getLeagueRepository(userId).getLeaderboard(leagueId),
  ])

  const memberCount = members.length
  const me = members.find(m => m.me)

  return NextResponse.json({
    user: {
      name: me?.name ?? session.user.name ?? session.user.email ?? 'Tú',
      color: me?.color ?? '#08F7FE',
      rank: me?.rank ?? null,
      pts: me?.pts ?? 0,
    },
    league: league
      ? { id: league.id, name: league.name, memberCount }
      : null,
  })
}
