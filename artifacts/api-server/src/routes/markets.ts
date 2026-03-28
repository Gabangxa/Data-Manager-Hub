import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { marketsTable, type InsertMarket } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/markets", async (req, res) => {
  try {
    const markets = await db
      .select()
      .from(marketsTable)
      .orderBy(sql`${marketsTable.score} DESC NULLS LAST`);
    res.json({ markets, count: markets.length });
  } catch (err) {
    req.log.error({ err }, "Failed to list markets");
    res.status(500).json({ error: "Failed to list markets" });
  }
});

router.post("/markets", async (req, res) => {
  try {
    const { markets } = req.body as { markets: InsertMarket[] };
    if (!Array.isArray(markets) || markets.length === 0) {
      res.status(400).json({ error: "markets array is required" });
      return;
    }

    await db
      .insert(marketsTable)
      .values(markets)
      .onConflictDoUpdate({
        target: marketsTable.marketId,
        set: {
          question: sql`EXCLUDED.question`,
          eventTitle: sql`EXCLUDED.event_title`,
          tags: sql`EXCLUDED.tags`,
          negRisk: sql`EXCLUDED.neg_risk`,
          tokenIds: sql`EXCLUDED.token_ids`,
          volume24h: sql`EXCLUDED.volume_24h`,
          liquidity: sql`EXCLUDED.liquidity`,
          endDate: sql`EXCLUDED.end_date`,
          hoursToClose: sql`EXCLUDED.hours_to_close`,
          feesEnabled: sql`EXCLUDED.fees_enabled`,
          score: sql`EXCLUDED.score`,
          updatedAt: sql`NOW()`,
        },
      });

    res.json({ upserted: markets.length });
  } catch (err) {
    req.log.error({ err }, "Failed to upsert markets");
    res.status(500).json({ error: "Failed to upsert markets" });
  }
});

export default router;
