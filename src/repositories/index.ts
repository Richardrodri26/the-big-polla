import type { ILeagueRepository, IMatchRepository, IPredictionRepository } from '@/repositories/interfaces'
import { PrismaLeagueRepository } from '@/repositories/prisma/league.repository'
import { PrismaMatchRepository } from '@/repositories/prisma/match.repository'
import { PrismaPredictionRepository } from '@/repositories/prisma/prediction.repository'

export function getMatchRepository(): IMatchRepository {
  return new PrismaMatchRepository()
}

export function getLeagueRepository(userId?: string): ILeagueRepository {
  return new PrismaLeagueRepository(userId)
}

export function getPredictionRepository(userId: string): IPredictionRepository {
  return new PrismaPredictionRepository(userId)
}
