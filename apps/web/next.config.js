/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cargo/api", "@cargo/db", "@cargo/shared"],
  serverExternalPackages: [
    "undici",
    "puppeteer-core",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
  ],
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
