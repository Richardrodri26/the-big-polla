'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ScoringService } from '@/lib/scoring-service'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) return { error: 'Unauthorized' }
  if (session.user.role !== 'SUPER_ADMIN') return { error: 'Forbidden' }

  if (!Number.isInteger(homeScore) || homeScore < 0) return { error: 'Invalid homeScore' }
  if (!Number.isInteger(awayScore) || awayScore < 0) return { error: 'Invalid awayScore' }

  await prisma.match.update({
    where: { id: matchId },
    data: { state: 'FINAL', homeScore, awayScore, locked: true },
  })

  await new ScoringService().scoreMatch(matchId)

  revalidatePath('/admin/matches')

  return { ok: true }
}
