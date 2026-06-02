import type { ILeagueRepository, IMatchRepository, IPredictionRepository } from '@/repositories/interfaces'

const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock'

export function getMatchRepository(): IMatchRepository {
  if (source === 'api') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaMatchRepository } = require('@/repositories/prisma/match.repository')
    return new PrismaMatchRepository()
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockMatchRepository } = require('@/repositories/mock/match.repository')
  return new MockMatchRepository()
}

export function getLeagueRepository(userId?: string): ILeagueRepository {
  if (source === 'api') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLeagueRepository } = require('@/repositories/prisma/league.repository')
    return new PrismaLeagueRepository(userId)
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockLeagueRepository } = require('@/repositories/mock/league.repository')
  return new MockLeagueRepository()
}

export function getPredictionRepository(userId?: string): IPredictionRepository {
  if (source === 'api') {
    if (!userId) throw new Error('userId required for PrismaPredictionRepository in api mode')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPredictionRepository } = require('@/repositories/prisma/prediction.repository')
    return new PrismaPredictionRepository(userId)
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockPredictionRepository } = require('@/repositories/mock/prediction.repository')
  return new MockPredictionRepository()
}
