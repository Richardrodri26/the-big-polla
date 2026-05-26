import { notFound } from 'next/navigation'
import { getMatchRepository } from '@/repositories'
import { MatchDetailScreen } from './match-detail-screen'

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const match = await getMatchRepository().getMatch(id)
  if (!match) notFound()
  return <MatchDetailScreen match={match} />
}
