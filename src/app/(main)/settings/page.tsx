import { getLeagueRepository } from '@/repositories'
import { SettingsScreen } from './settings-screen'

export default async function SettingsPage() {
  const [members, scoringRules] = await Promise.all([
    getLeagueRepository().getMembers('default'),
    getLeagueRepository().getScoringRules('default'),
  ])

  return <SettingsScreen members={members} scoringRules={scoringRules} />
}
