import fs from "fs";
import path from "path";
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const LOG_RETENTION_DAYS = 14;

const pinoOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
};

// ── Production: write to both stdout and a daily log file ────────────────────

function buildProductionLogger(): pino.Logger {
  const logsDir = process.env.LOGS_DIR ?? "logs";
  fs.mkdirSync(logsDir, { recursive: true });
  _cleanupOldLogs(logsDir);

  const today   = new Date().toISOString().split("T")[0];
  const logPath = path.join(logsDir, `api-${today}.log`);

  return pino(
    pinoOptions,
    pino.multistream([
      { stream: process.stdout },
      { stream: fs.createWriteStream(logPath, { flags: "a" }) },
    ]),
  );
}

// ── Dev: pino-pretty to stdout only ──────────────────────────────────────────

function buildDevLogger(): pino.Logger {
  return pino({
    ...pinoOptions,
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  });
}

// ── Log retention cleanup ─────────────────────────────────────────────────────

function _cleanupOldLogs(dir: string): void {
  try {
    const cutoff = Date.now() - LOG_RETENTION_DAYS * 86_400_000;
    let removed  = 0;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".log")) continue;
      const full = path.join(dir, file);
      if (fs.statSync(full).mtimeMs < cutoff) {
        fs.unlinkSync(full);
        removed++;
      }
    }
    if (removed > 0) {
      process.stdout.write(
        `[logger] Removed ${removed} log file(s) older than ${LOG_RETENTION_DAYS} days\n`,
      );
    }
  } catch {
    // Non-fatal — dir may not exist yet or be unreadable
  }
}

export const logger = isProduction ? buildProductionLogger() : buildDevLogger();
