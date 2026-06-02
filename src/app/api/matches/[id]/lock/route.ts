import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const body = await req.json() as { liveMinute?: number }

  await prisma.match.update({
    where: { id },
    data: {
      state: 'LIVE',
      locked: true,
      liveMinute: body.liveMinute ?? 0,
    },
  })

  return NextResponse.json({ ok: true, matchId: id })
}
