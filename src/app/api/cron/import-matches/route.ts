import { NextRequest, NextResponse } from 'next/server'
import { importWorldCupMatches } from '@/lib/match-import'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  // Allow unauthenticated access in development when no secret is configured
  if (!secret) return process.env.NODE_ENV === 'development'
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await importWorldCupMatches()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/import-matches]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
