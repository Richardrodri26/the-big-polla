import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

config({ path: '.env.local' })

// Neon via Vercel provides DATABASE_URL_UNPOOLED for direct connections
// required by prisma migrate. Fall back to DATABASE_URL for local dev.
const migrationUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: migrationUrl!,
  },
})
