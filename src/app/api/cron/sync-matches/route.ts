import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchExternalMatches } from '@/lib/match-sync'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const externalMatches = await fetchExternalMatches()

  if (externalMatches.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, message: 'No external data available yet' })
  }

  const results = { locked: 0, scored: 0, updated: 0 }

  for (const ext of externalMatches) {
    const current = await prisma.match.findUnique({ where: { id: ext.id } })
    if (!current) continue

    // Transición PENDING → LIVE: bloquear predicciones
    if (current.state === 'PENDING' && ext.state === 'LIVE') {
      await prisma.match.update({
        where: { id: ext.id },
        data: { state: 'LIVE', locked: true, liveMinute: ext.liveMinute ?? 0 },
      })
      results.locked++
    }

    // Actualizar minuto en vivo
    if (current.state === 'LIVE' && ext.state === 'LIVE' && ext.liveMinute !== null) {
      await prisma.match.update({
        where: { id: ext.id },
        data: { liveMinute: ext.liveMinute },
      })
      results.updated++
    }

    // Transición LIVE → FINAL: actualizar resultado y disparar puntuación
    if (current.state === 'LIVE' && ext.state === 'FINAL') {
      await prisma.match.update({
        where: { id: ext.id },
        data: {
          state: 'FINAL',
          homeScore: ext.homeScore,
          awayScore: ext.awayScore,
          locked: true,
          liveMinute: null,
        },
      })

      // Importar inline para evitar que Next.js lo incluya en el bundle client
      const { ScoringService } = await import('@/lib/scoring-service')
      const service = new ScoringService()
      await service.scoreMatch(ext.id)
      results.scored++
    }
  }

  return NextResponse.json({ ok: true, ...results })
}
