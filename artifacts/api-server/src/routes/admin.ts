import { Router } from "express";
import { db } from "@workspace/db";
import { marketsTable, snapshotsTable, signalsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const router = Router();

const TOKEN = process.env.MIGRATION_TOKEN;

function checkToken(req: any, res: any): boolean {
  const provided = req.headers["x-migration-token"];
  if (!TOKEN || provided !== TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.post("/admin/migrate/markets", async (req, res) => {
  if (!checkToken(req, res)) return;
  const rows: any[] = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.json({ inserted: 0 });
  }
  await db
    .insert(marketsTable)
    .values(rows)
    .onConflictDoUpdate({
      target: marketsTable.marketId,
      set: {
        conditionId: sql`excluded.condition_id`,
        question: sql`excluded.question`,
        eventTitle: sql`excluded.event_title`,
        eventSlug: sql`excluded.event_slug`,
        tags: sql`excluded.tags`,
        negRisk: sql`excluded.neg_risk`,
        tokenIds: sql`excluded.token_ids`,
        outcomes: sql`excluded.outcomes`,
        volume24h: sql`excluded.volume_24h`,
        liquidity: sql`excluded.liquidity`,
        endDate: sql`excluded.end_date`,
        hoursToClose: sql`excluded.hours_to_close`,
        feesEnabled: sql`excluded.fees_enabled`,
        score: sql`excluded.score`,
        addedAt: sql`excluded.added_at`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
  return res.json({ inserted: rows.length });
});

router.post("/admin/migrate/snapshots", async (req, res) => {
  if (!checkToken(req, res)) return;
  const rows: any[] = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.json({ inserted: 0 });
  }
  const mapped = rows.map(({ id: _id, ...r }) => r);
  let inserted = 0;
  const BATCH = 200;
  for (let i = 0; i < mapped.length; i += BATCH) {
    const batch = mapped.slice(i, i + BATCH);
    await db.insert(snapshotsTable).values(batch).onConflictDoNothing();
    inserted += batch.length;
  }
  return res.json({ inserted });
});

router.post("/admin/migrate/signals", async (req, res) => {
  if (!checkToken(req, res)) return;
  const rows: any[] = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.json({ inserted: 0 });
  }
  const mapped = rows.map(({ id: _id, ...r }) => r);
  await db.insert(signalsTable).values(mapped).onConflictDoNothing();
  return res.json({ inserted: mapped.length });
});

router.get("/admin/migrate/status", async (req, res) => {
  if (!checkToken(req, res)) return;
  const result = await db.execute<{ markets: string; snapshots: string; signals: string }>(
    sql`SELECT
      (SELECT COUNT(*) FROM markets)::text AS markets,
      (SELECT COUNT(*) FROM snapshots)::text AS snapshots,
      (SELECT COUNT(*) FROM signals)::text AS signals`
  );
  const row = result.rows[0];
  return res.json({
    markets: Number(row.markets),
    snapshots: Number(row.snapshots),
    signals: Number(row.signals),
  });
});

export default router;
