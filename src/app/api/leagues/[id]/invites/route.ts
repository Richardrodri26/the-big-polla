import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueInviteRepository } from '@/repositories/prisma/league-invite.repository'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const inviteRepo = new PrismaLeagueInviteRepository()
const leagueRepo = new PrismaLeagueManagementRepository()

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params
  const league = await leagueRepo.getLeague(leagueId)
  if (!league) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (league.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const invite = await inviteRepo.createInvite(leagueId, session.user.id)
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/join/${invite.token}`
  return NextResponse.json({ invite, url }, { status: 201 })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params
  const league = await leagueRepo.getLeague(leagueId)
  if (!league) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (league.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const invites = await inviteRepo.listInvites(leagueId)
  return NextResponse.json({ invites })
}
