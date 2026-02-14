/**
 * PM2 Ecosystem Configuration
 * Used for non-Docker deployments (Timeweb VPS with PM2)
 */
module.exports = {
  apps: [
    {
      name: "cargo-web",
      cwd: "./apps/web",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/cargo/web-error.log",
      out_file: "/var/log/cargo/web-out.log",
      merge_logs: true,
      // Restart policy
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "512M",
      // Watch (disabled in production)
      watch: false,
    },
  ],
};
