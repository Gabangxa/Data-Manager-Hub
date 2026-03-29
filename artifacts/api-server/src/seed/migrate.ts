import { db } from "@workspace/db";
import { marketsTable, snapshotsTable, signalsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

import marketsData from "./markets.json";
import signalsData from "./signals.json";
import snapshotsData from "./snapshots.json";

export async function seedProductionIfEmpty(): Promise<void> {
  const result = await db.execute<{ cnt: string }>(
    sql`SELECT COUNT(*)::text AS cnt FROM markets`
  );
  const existingCount = Number(result.rows[0]?.cnt ?? "0");

  if (existingCount > 0) {
    logger.info({ existingCount }, "DB already has data — skipping seed");
    return;
  }

  logger.info("Empty database detected — seeding from dev snapshot...");

  await db
    .insert(marketsTable)
    .values(marketsData as any[])
    .onConflictDoNothing();
  logger.info({ count: marketsData.length }, "Seeded markets");

  const BATCH = 200;
  const snaps = snapshotsData as any[];
  for (let i = 0; i < snaps.length; i += BATCH) {
    await db
      .insert(snapshotsTable)
      .values(snaps.slice(i, i + BATCH).map(({ id: _id, ...r }) => r))
      .onConflictDoNothing();
  }
  logger.info({ count: snaps.length }, "Seeded snapshots");

  await db
    .insert(signalsTable)
    .values((signalsData as any[]).map(({ id: _id, ...r }) => r))
    .onConflictDoNothing();
  logger.info({ count: signalsData.length }, "Seeded signals");

  logger.info("Database seed complete");
}
