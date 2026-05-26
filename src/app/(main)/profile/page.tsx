import { getLeagueRepository, getMatchRepository } from '@/repositories'
import { ProfileScreen } from './profile-screen'

export default async function ProfilePage() {
  const [matches, members, badges] = await Promise.all([
    getMatchRepository().getMatches({ state: 'final' }),
    getLeagueRepository().getMembers('default'),
    getLeagueRepository().getBadges('me'),
  ])

  const me = members.find(m => m.me)
  if (!me) throw new Error('Current user not found in members')

  return <ProfileScreen me={me} members={members} finishedMatches={matches} badges={badges} />
}
