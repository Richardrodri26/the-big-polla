import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueInviteRepository } from '@/repositories/prisma/league-invite.repository'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const inviteRepo = new PrismaLeagueInviteRepository()
const leagueRepo = new PrismaLeagueManagementRepository()

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await params
  const invite = await inviteRepo.getInviteByToken(token)
  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  try {
    await leagueRepo.joinLeague(invite.leagueId, session.user.id)
    await inviteRepo.incrementUsedCount(token)
    return NextResponse.json({ ok: true, leagueId: invite.leagueId })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('already')) {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 })
    }
    throw err
  }
}
