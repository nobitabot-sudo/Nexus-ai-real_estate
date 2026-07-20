import { Router } from "express";
import { db, clientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";
import { OnboardClientBody } from "@workspace/api-zod";

const clientsMeRouter = Router();

function mapClient(c: typeof clientsTable.$inferSelect) {
  return {
    id: c.id,
    clientCode: c.clientCode,
    name: c.name,
    assistantId: c.assistantId,
    niche: c.niche ?? null,
    planType: c.planType,
    phoneNumberId: c.phoneNumberId ?? null,
    callLimit: c.callLimit ?? null,
    clerkUserId: c.clerkUserId ?? null,
    isLinked: true,
    createdAt: c.createdAt.toISOString(),
  };
}

// GET /api/clients/me
clientsMeRouter.get("/clients/me", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as any).clerkUserId as string;
  try {
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.clerkUserId, clerkUserId));
    if (!client) { res.status(404).json({ error: "No client record linked to this account" }); return; }
    res.json(mapClient(client));
  } catch (err) {
    req.log.error({ err }, "Failed to get client/me");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/clients/onboard
clientsMeRouter.post("/clients/onboard", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as any).clerkUserId as string;
  const parsed = OnboardClientBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "clientCode is required" }); return; }

  try {
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.clientCode, parsed.data.clientCode));
    if (!client) { res.status(400).json({ error: "Invalid client code" }); return; }
    if (client.clerkUserId && client.clerkUserId !== clerkUserId) {
      res.status(400).json({ error: "This code has already been used" });
      return;
    }

    const [updated] = await db.update(clientsTable).set({ clerkUserId }).where(eq(clientsTable.clientCode, parsed.data.clientCode)).returning();
    res.json(mapClient(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to onboard client");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default clientsMeRouter;
