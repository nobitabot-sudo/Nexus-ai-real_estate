import { Router } from "express";
import { listVapiCalls, getVapiCall, getVapiCallStats } from "../lib/vapi.js";
import {
  ListCallsQueryParams,
  GetCallParams,
} from "@workspace/api-zod";

const callsRouter = Router();

// GET /api/calls/stats — must come before /:id
callsRouter.get("/calls/stats", async (req, res) => {
  try {
    const stats = await getVapiCallStats();
    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch VAPI call stats");
    res.status(502).json({ error: "Failed to fetch call stats from VAPI" });
  }
});

// GET /api/calls
callsRouter.get("/calls", async (req, res) => {
  const parsed = ListCallsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { limit, createdAtGt, status } = parsed.data;
  try {
    const calls = await listVapiCalls({
      limit,
      createdAtGt: createdAtGt ?? undefined,
      status: status ?? undefined,
    });
    res.json(calls);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch VAPI calls");
    res.status(502).json({ error: "Failed to fetch calls from VAPI" });
  }
});

// GET /api/calls/:id
callsRouter.get("/calls/:id", async (req, res) => {
  const parsed = GetCallParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid call ID" });
    return;
  }
  const { id } = parsed.data;
  try {
    const call = await getVapiCall(id);
    res.json(call);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("404")) {
      res.status(404).json({ error: "Call not found" });
      return;
    }
    req.log.error({ err }, "Failed to fetch VAPI call");
    res.status(502).json({ error: "Failed to fetch call from VAPI" });
  }
});

export default callsRouter;
