import { betterFetch } from '@better-fetch/fetch'
import { NextRequest, NextResponse } from 'next/server'

interface SessionResponse {
  user: { id: string; email: string; name: string } | null
  session: { id: string; expiresAt: string } | null
}

export async function proxy(req: NextRequest) {
  const { data } = await betterFetch<SessionResponse>('/api/auth/get-session', {
    baseURL: req.nextUrl.origin,
    headers: { cookie: req.headers.get('cookie') ?? '' },
  })

  if (!data?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/feed/:path*',
    '/leaderboard/:path*',
    '/oracle/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
}
