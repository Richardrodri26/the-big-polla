import type { ILeagueRepository, IMatchRepository, IPredictionRepository } from '@/repositories/interfaces'
import { PrismaLeagueRepository } from '@/repositories/prisma/league.repository'
import { PrismaMatchRepository } from '@/repositories/prisma/match.repository'
import { PrismaPredictionRepository } from '@/repositories/prisma/prediction.repository'
import { MockLeagueRepository } from '@/repositories/mock/league.repository'
import { MockMatchRepository } from '@/repositories/mock/match.repository'
import { MockPredictionRepository } from '@/repositories/mock/prediction.repository'

const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock'

export function getMatchRepository(): IMatchRepository {
  if (source === 'api') return new PrismaMatchRepository()
  return new MockMatchRepository()
}

export function getLeagueRepository(userId?: string): ILeagueRepository {
  if (source === 'api') return new PrismaLeagueRepository(userId)
  return new MockLeagueRepository()
}

export function getPredictionRepository(userId?: string): IPredictionRepository {
  if (source === 'api') {
    if (!userId) throw new Error('userId required for PrismaPredictionRepository in api mode')
    return new PrismaPredictionRepository(userId)
  }
  return new MockPredictionRepository()
}
