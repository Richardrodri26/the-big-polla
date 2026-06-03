import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const repo = new PrismaLeagueManagementRepository()

export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const leagues = await repo.getUserLeagues(session.user.id)
  return NextResponse.json({ leagues })
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { name?: string; type?: string; maxMembers?: number }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 3) {
    return NextResponse.json({ error: 'name must be at least 3 characters' }, { status: 400 })
  }

  const type = body.type === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE'

  const league = await repo.createLeague({
    name: body.name.trim(),
    type,
    ownerId: session.user.id,
    maxMembers: typeof body.maxMembers === 'number' && body.maxMembers > 0 ? body.maxMembers : null,
  })

  await repo.joinLeague(league.id, session.user.id)

  return NextResponse.json({ league }, { status: 201 })
}
