import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const repo = new PrismaLeagueManagementRepository()

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const league = await repo.getLeague(id)
  if (!league) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ league })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { name?: string; type?: string }

  try {
    const league = await repo.updateLeague(
      id,
      {
        name: body.name?.trim(),
        type: body.type === 'PUBLIC' || body.type === 'PRIVATE' ? body.type : undefined,
      },
      session.user.id
    )
    return NextResponse.json({ league })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Not authorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    throw err
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await repo.deleteLeague(id, session.user.id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Not authorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    throw err
  }
}
