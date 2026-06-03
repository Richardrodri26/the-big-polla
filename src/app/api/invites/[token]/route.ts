import { NextRequest, NextResponse } from 'next/server'
import { PrismaLeagueInviteRepository } from '@/repositories/prisma/league-invite.repository'

const inviteRepo = new PrismaLeagueInviteRepository()

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const invite = await inviteRepo.getInviteByToken(token)
  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  return NextResponse.json({ invite })
}
