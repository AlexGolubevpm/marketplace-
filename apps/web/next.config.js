/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cargo/api", "@cargo/db", "@cargo/shared"],
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
