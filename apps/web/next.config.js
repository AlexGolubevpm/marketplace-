/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cargo/api", "@cargo/db", "@cargo/shared"],
  // standalone output — required for Docker, ignored by "next dev"
  output: "standalone",
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
