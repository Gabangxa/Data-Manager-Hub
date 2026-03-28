import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { marketsTable, snapshotsTable, signalsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    const [marketCount] = await db.select({ n: sql<number>`cast(count(*) as int)` }).from(marketsTable);
    const [snapshotCount] = await db.select({ n: sql<number>`cast(count(*) as int)` }).from(snapshotsTable);
    const [signalCount] = await db.select({ n: sql<number>`cast(count(*) as int)` }).from(signalsTable);

    res.json({
      status: "ok",
      markets: marketCount.n,
      snapshots: snapshotCount.n,
      signals: signalCount.n,
    });
  } catch {
    res.json({ status: "ok" });
  }
});

export default router;
