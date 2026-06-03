import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const picks = await prisma.oraclePick.findMany({
    where: { userId: session.user.id },
    select: { round: true, slotId: true, teamCode: true },
  })

  return NextResponse.json(picks)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { round: string; slotId: string; teamCode: string | null }
  const { round, slotId, teamCode } = body

  if (!round || !slotId) {
    return NextResponse.json({ error: 'Missing round or slotId' }, { status: 400 })
  }

  if (teamCode === null) {
    await prisma.oraclePick.deleteMany({
      where: { userId: session.user.id, round, slotId },
    })
    return NextResponse.json({ ok: true, action: 'deleted' })
  }

  await prisma.oraclePick.upsert({
    where: { userId_round_slotId: { userId: session.user.id, round, slotId } },
    update: { teamCode, updatedAt: new Date() },
    create: { userId: session.user.id, round, slotId, teamCode },
  })

  return NextResponse.json({ ok: true, action: 'saved' })
}
