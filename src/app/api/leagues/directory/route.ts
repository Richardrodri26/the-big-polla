import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const repo = new PrismaLeagueManagementRepository()

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? undefined
  const page = Number(searchParams.get('page') ?? '1')
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50)

  const result = await repo.getPublicLeagues({ search, page, limit })
  return NextResponse.json(result)
}
