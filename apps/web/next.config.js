/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  transpilePackages: ["@cargo/api", "@cargo/db", "@cargo/shared"],
  // Note: "standalone" output is used only in Dockerfile.
  // For PM2 deploys, regular output is used with "next start".
  output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
