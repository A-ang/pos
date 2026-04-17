import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vehiclesRouter from "./vehicles";
import customersRouter from "./customers";
import maintenanceRouter from "./maintenance";
import bookingsRouter from "./bookings";
import transactionsRouter from "./transactions";
import reportsRouter from "./reports";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(vehiclesRouter);
router.use(maintenanceRouter);
router.use(customersRouter);
router.use(bookingsRouter);
router.use(transactionsRouter);
router.use(reportsRouter);

export default router;
