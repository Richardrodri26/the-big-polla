import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const teams = await prisma.worldCupTeam.findMany({
    orderBy: [{ group: 'asc' }, { seed: 'asc' }],
  })
  return NextResponse.json(teams)
}
