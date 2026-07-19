import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, clientsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { listVapiCalls, getVapiCall, getVapiCallStats } from "../lib/vapi.js";
import { ListCallsQueryParams, GetCallStatsQueryParams, GetCallParams } from "@workspace/api-zod";

const callsRouter = Router();

async function getUserContext(clerkUserId: string): Promise<{ role: string; assistantId?: string }> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, clerkUserId));
  if (!user) return { role: "client" };
  if (user.role === "admin") return { role: "admin" };
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.clerkUserId, clerkUserId));
  return { role: "client", assistantId: client?.assistantId };
}

// GET /api/calls/stats — must be before /:id
callsRouter.get("/calls/stats", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const qParsed = GetCallStatsQueryParams.safeParse(req.query);
  const { role, assistantId: clientAssistantId } = await getUserContext(auth.userId);
  const forcedAssistantId = role === "admin" ? (qParsed.success ? qParsed.data.assistantId ?? undefined : undefined) : clientAssistantId;

  try {
    const stats = await getVapiCallStats(forcedAssistantId);
    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch VAPI call stats");
    res.status(502).json({ error: "Failed to fetch call stats from VAPI" });
  }
});

// GET /api/calls
callsRouter.get("/calls", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = ListCallsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query parameters" }); return; }

  const { role, assistantId: clientAssistantId } = await getUserContext(auth.userId);
  const assistantId = role === "admin"
    ? (parsed.data.assistantId ?? undefined)
    : clientAssistantId;

  try {
    const calls = await listVapiCalls({
      limit: parsed.data.limit,
      createdAtGt: parsed.data.createdAtGt ?? undefined,
      status: parsed.data.status ?? undefined,
      assistantId,
    });
    res.json(calls);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch VAPI calls");
    res.status(502).json({ error: "Failed to fetch calls from VAPI" });
  }
});

// GET /api/calls/:id
callsRouter.get("/calls/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = GetCallParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid call ID" }); return; }

  try {
    const call = await getVapiCall(params.data.id);
    // Clients can only see their own assistant's calls
    const { role, assistantId: clientAssistantId } = await getUserContext(auth.userId);
    if (role !== "admin" && call.assistantId && clientAssistantId && call.assistantId !== clientAssistantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    res.json(call);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("404")) { res.status(404).json({ error: "Call not found" }); return; }
    req.log.error({ err }, "Failed to fetch VAPI call");
    res.status(502).json({ error: "Failed to fetch call from VAPI" });
  }
});

export default callsRouter;
