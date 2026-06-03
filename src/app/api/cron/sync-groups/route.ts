import { NextRequest, NextResponse } from 'next/server'
import { syncWorldCupGroups } from '@/lib/group-sync'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncWorldCupGroups()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/sync-groups]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
