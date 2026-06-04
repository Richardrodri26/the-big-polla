import { prisma } from '../src/lib/prisma'
import { auth } from '../src/lib/auth'
import { importWorldCupMatches } from '../src/lib/match-import'

const SUPER_ADMIN_EMAIL = 'test@gmail.com'
const SUPER_ADMIN_PASSWORD = '123456789'
const SUPER_ADMIN_NAME = 'Super Admin'
const SUPER_ADMIN_HANDLE = 'superadmin'

async function seedSuperAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } })

  if (existing) {
    await prisma.user.update({ where: { email: SUPER_ADMIN_EMAIL }, data: { role: 'SUPER_ADMIN' } })
    console.log('[seed] superAdmin role updated for existing user')
    return
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
  console.log('[seed] superAdmin created and role set to SUPER_ADMIN')
}

async function main() {
  console.log('[seed] Seeding superAdmin...')
  await seedSuperAdmin()

  console.log('[seed] Importing WorldCup matches from football-data.org...')
  const { imported, skipped } = await importWorldCupMatches()
  console.log(`[seed] Done: ${imported} imported, ${skipped} skipped`)
}

main().catch(console.error).finally(() => process.exit(0))
