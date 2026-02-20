/**
 * PM2 Ecosystem Configuration
 */
const fs = require("fs");
const path = require("path");

// Read .env file and parse key=value pairs
function loadEnv(filePath) {
  const env = {};
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      env[key] = value;
    }
  } catch {}
  return env;
}

const rootEnv = loadEnv(path.join(__dirname, ".env"));
const webEnv = loadEnv(path.join(__dirname, "apps/web/.env"));
const botEnv = loadEnv(path.join(__dirname, "apps/bot/.env"));

// Merge: file .env values override, process.env as fallback
const DATABASE_URL = webEnv.DATABASE_URL || rootEnv.DATABASE_URL || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/cargo_marketplace";
const TELEGRAM_BOT_TOKEN = botEnv.TELEGRAM_BOT_TOKEN || rootEnv.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
const APP_URL = webEnv.NEXT_PUBLIC_APP_URL || rootEnv.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://cargomarketplace.ru";
const JWT_SECRET = webEnv.JWT_SECRET || rootEnv.JWT_SECRET || process.env.JWT_SECRET || "";
const YANDEX_CLIENT_ID = webEnv.YANDEX_CLIENT_ID || rootEnv.YANDEX_CLIENT_ID || process.env.YANDEX_CLIENT_ID || "";
const YANDEX_CLIENT_SECRET = webEnv.YANDEX_CLIENT_SECRET || rootEnv.YANDEX_CLIENT_SECRET || process.env.YANDEX_CLIENT_SECRET || "";

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
        DATABASE_URL,
        NEXT_PUBLIC_APP_URL: APP_URL,
        JWT_SECRET,
        YANDEX_CLIENT_ID,
        YANDEX_CLIENT_SECRET,
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
        TELEGRAM_BOT_TOKEN,
        NEXT_PUBLIC_APP_URL: APP_URL,
        DATABASE_URL,
      },
      max_restarts: 10,
      min_uptime: "5s",
      watch: false,
    },
  ],
};
