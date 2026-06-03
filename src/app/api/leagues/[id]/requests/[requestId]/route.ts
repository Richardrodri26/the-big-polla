import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const repo = new PrismaLeagueManagementRepository()

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId } = await params
  const body = await req.json() as { action: 'approve' | 'reject' }

  if (body.action !== 'approve' && body.action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  try {
    if (body.action === 'approve') {
      await repo.approveRequest(requestId, session.user.id)
    } else {
      await repo.rejectRequest(requestId, session.user.id)
    }
    return NextResponse.json({ ok: true, action: body.action })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Not authorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    throw err
  }
}
