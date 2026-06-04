// Production seed — uses POSTGRES_URL_NON_POOLING to avoid .env.local DATABASE_URL override
async function main() {
  // POSTGRES_URL_NON_POOLING is set by Vercel/Neon and NOT present in .env.local
  const prodUrl = process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL_UNPOOLED
  if (!prodUrl || prodUrl.includes('127.0.0.1') || prodUrl.includes('localhost')) {
    console.error('[seed-prod] ERROR: No production database URL found. POSTGRES_URL_NON_POOLING is required.')
    console.error('[seed-prod] Got:', prodUrl ?? 'undefined')
    process.exit(1)
  }

  // Override DATABASE_URL with the non-pooling production URL before importing prisma
  process.env.DATABASE_URL = prodUrl
  console.log('[seed-prod] Connecting to:', prodUrl.replace(/\/\/[^@]+@/, '//***@'))

  const { prisma } = await import('../src/lib/prisma')
  const { auth } = await import('../src/lib/auth')

  const SUPER_ADMIN_EMAIL = 'test@gmail.com'
  const SUPER_ADMIN_PASSWORD = '123456789'
  const SUPER_ADMIN_NAME = 'Super Admin'
  const SUPER_ADMIN_HANDLE = 'superadmin'

  const existing = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } })

  if (existing) {
    await prisma.user.update({ where: { email: SUPER_ADMIN_EMAIL }, data: { role: 'SUPER_ADMIN' } })
    console.log('[seed-prod] superAdmin role updated')
  } else {
    await auth.api.signUpEmail({
      body: {
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        name: SUPER_ADMIN_NAME,
        handle: SUPER_ADMIN_HANDLE,
      },
    })
    await prisma.user.update({ where: { email: SUPER_ADMIN_EMAIL }, data: { role: 'SUPER_ADMIN' } })
    console.log('[seed-prod] superAdmin created with SUPER_ADMIN role')
  }
}

main().catch(console.error).finally(() => process.exit(0))
