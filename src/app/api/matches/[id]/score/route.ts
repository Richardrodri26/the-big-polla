import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ScoringService } from '@/lib/scoring-service'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const body = await req.json() as { homeScore?: number; awayScore?: number; state?: string }

  // Actualizar el partido con el resultado final
  await prisma.match.update({
    where: { id },
    data: {
      state: body.state === 'FINAL' ? 'FINAL' : undefined,
      homeScore: body.homeScore ?? undefined,
      awayScore: body.awayScore ?? undefined,
      locked: true,
    },
  })

  // Disparar el motor de puntuación
  const service = new ScoringService()
  await service.scoreMatch(id)

  return NextResponse.json({ ok: true, matchId: id })
}
