/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cargo/api", "@cargo/db", "@cargo/shared"],
  output: "standalone",
};

module.exports = nextConfig;
