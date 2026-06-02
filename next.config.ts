import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter", "kysely"],
};

export default nextConfig;
