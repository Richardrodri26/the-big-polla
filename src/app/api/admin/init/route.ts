import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-init-token')
  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const SUPER_ADMIN_EMAIL = 'test@gmail.com'
  const SUPER_ADMIN_PASSWORD = '123456789'
  const SUPER_ADMIN_NAME = 'Super Admin'
  const SUPER_ADMIN_HANDLE = 'superadmin'

  const existing = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } })

  if (existing) {
    await prisma.user.update({ where: { email: SUPER_ADMIN_EMAIL }, data: { role: 'SUPER_ADMIN' } })
    return NextResponse.json({ ok: true, action: 'updated', email: SUPER_ADMIN_EMAIL })
  }

  await auth.api.signUpEmail({
    body: {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      name: SUPER_ADMIN_NAME,
      handle: SUPER_ADMIN_HANDLE,
    },
  })

  await prisma.user.update({ where: { email: SUPER_ADMIN_EMAIL }, data: { role: 'SUPER_ADMIN' } })

  return NextResponse.json({ ok: true, action: 'created', email: SUPER_ADMIN_EMAIL })
}
