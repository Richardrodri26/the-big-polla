import { notFound } from 'next/navigation'
import { PrismaLeagueInviteRepository } from '@/repositories/prisma/league-invite.repository'
import { JoinInviteScreen } from './join-invite-screen'

const inviteRepo = new PrismaLeagueInviteRepository()

interface Props {
  params: Promise<{ token: string }>
}

export default async function JoinInvitePage({ params }: Props) {
  const { token } = await params
  const invite = await inviteRepo.getInviteByToken(token)

  if (!invite) notFound()
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) notFound()

  return (
    <JoinInviteScreen
      token={token}
      leagueName={invite.leagueName}
      memberCount={invite.memberCount}
    />
  )
}
