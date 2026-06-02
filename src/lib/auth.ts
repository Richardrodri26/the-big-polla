import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      handle: {
        type: 'string',
        required: true,
        unique: true,
        input: true,
      },
      color: {
        type: 'string',
        defaultValue: '#00D26A',
        input: false,
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type AuthUser = typeof auth.$Infer.Session.user
