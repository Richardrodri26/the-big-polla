import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter", "kysely"],
  turbopack: {
    ignoreIssue: [
      {
        // better-auth bundles @better-auth/kysely-adapter internally but this project
        // uses the prisma adapter — suppress Turbopack static analysis errors from
        // kysely dialect files that are never executed at runtime.
        path: "**/node_modules/better-auth/node_modules/@better-auth/kysely-adapter/**",
      },
    ],
  },
};

export default nextConfig;
