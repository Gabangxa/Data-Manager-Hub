import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketsRouter from "./markets";
import snapshotsRouter from "./snapshots";
import signalsRouter from "./signals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketsRouter);
router.use(snapshotsRouter);
router.use(signalsRouter);

export default router;
