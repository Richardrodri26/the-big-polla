import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CreateLeagueScreen } from './create-league-screen'

export default async function CreateLeaguePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  return <CreateLeagueScreen />
}
