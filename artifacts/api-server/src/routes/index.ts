import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import callsRouter from "./calls.js";
import authRouter from "./auth.js";
import adminClientsRouter from "./adminClients.js";
import clientsMeRouter from "./clientsMe.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminClientsRouter);
router.use(clientsMeRouter);
router.use(callsRouter);

export default router;
