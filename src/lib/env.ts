import "server-only";
import { appPasswordSchema, databaseUrlSchema, logLevelSchema, parseEnv } from "./env-schema";

export function getDatabaseUrl() {
  return parseEnv("DATABASE_URL", process.env.DATABASE_URL, databaseUrlSchema);
}

export function getLogLevel() {
  return parseEnv("LOG_LEVEL", process.env.LOG_LEVEL, logLevelSchema);
}

export function getAppPassword() {
  return parseEnv("APP_PASSWORD", process.env.APP_PASSWORD, appPasswordSchema);
}
