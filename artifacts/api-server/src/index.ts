import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { seedProductionIfEmpty } from "./seed/migrate";

const port = Number(process.env["PORT"] ?? "8080");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

async function applyMigrations() {
  await db.execute(
    sql`ALTER TABLE signals ADD COLUMN IF NOT EXISTS outcome boolean`,
  );
  logger.info({
    pgHost: process.env["PGHOST"] ?? "unknown",
    pgDatabase: process.env["PGDATABASE"] ?? "unknown",
    pgPort: process.env["PGPORT"] ?? "unknown",
    pgUser: process.env["PGUSER"] ?? "unknown",
  }, "DB migrations applied");
  await seedProductionIfEmpty();
}

applyMigrations()
  .then(() => {
    app.listen(port, '0.0.0.0', (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to apply DB migrations — aborting startup");
    process.exit(1);
  });
