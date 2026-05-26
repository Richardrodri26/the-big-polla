import { MockLeagueRepository } from '@/repositories/mock/league.repository'
import { MockMatchRepository } from '@/repositories/mock/match.repository'
import { MockPredictionRepository } from '@/repositories/mock/prediction.repository'
import type { ILeagueRepository, IMatchRepository, IPredictionRepository } from '@/repositories/interfaces'

const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock'

export function getMatchRepository(): IMatchRepository {
  if (source === 'api') throw new Error('ApiMatchRepository not implemented yet')
  return new MockMatchRepository()
}

export function getLeagueRepository(): ILeagueRepository {
  if (source === 'api') throw new Error('ApiLeagueRepository not implemented yet')
  return new MockLeagueRepository()
}

export function getPredictionRepository(): IPredictionRepository {
  if (source === 'api') throw new Error('ApiPredictionRepository not implemented yet')
  return new MockPredictionRepository()
}
