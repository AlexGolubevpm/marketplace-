/**
 * PM2 Ecosystem Configuration
 */
module.exports = {
  apps: [
    {
      name: "cargo-web",
      cwd: "./apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "512M",
      watch: false,
    },
    {
      name: "cargo-bot",
      cwd: "./apps/bot",
      script: "src/index.ts",
      interpreter: "node",
      interpreter_args: "--import tsx",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      min_uptime: "5s",
      watch: false,
    },
  ],
};
