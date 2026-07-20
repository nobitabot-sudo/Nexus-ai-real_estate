import { Router } from "express";
import { db, clientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";
import {
  CreateAdminClientBody,
  UpdateAdminClientBody,
  UpdateAdminClientParams,
  DeleteAdminClientParams,
} from "@workspace/api-zod";

const adminClientsRouter = Router();

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
    isLinked: !!c.clerkUserId,
    createdAt: c.createdAt.toISOString(),
  };
}

adminClientsRouter.get("/admin/clients", requireAdmin, async (req, res): Promise<void> => {
  try {
    const clients = await db.select().from(clientsTable).orderBy(clientsTable.createdAt);
    res.json(clients.map(mapClient));
  } catch (err) {
    req.log.error({ err }, "Failed to list clients");
    res.status(500).json({ error: "Internal server error" });
  }
});

adminClientsRouter.post("/admin/clients", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateAdminClientBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const [client] = await db.insert(clientsTable).values({
      clientCode: parsed.data.clientCode,
      name: parsed.data.name,
      assistantId: parsed.data.assistantId,
      niche: parsed.data.niche ?? null,
      planType: (parsed.data.planType as any) ?? "inbound",
      phoneNumberId: parsed.data.phoneNumberId ?? null,
      callLimit: parsed.data.callLimit ?? null,
    }).returning();
    res.status(201).json(mapClient(client));
  } catch (err: any) {
    if (err?.code === "23505") { res.status(400).json({ error: "Client code already exists" }); return; }
    req.log.error({ err }, "Failed to create client");
    res.status(500).json({ error: "Internal server error" });
  }
});

adminClientsRouter.patch("/admin/clients/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateAdminClientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid client ID" }); return; }
  const parsed = UpdateAdminClientBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.clientCode != null) updates.clientCode = parsed.data.clientCode;
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.assistantId != null) updates.assistantId = parsed.data.assistantId;
  if (parsed.data.niche !== undefined) updates.niche = parsed.data.niche;
  if (parsed.data.planType != null) updates.planType = parsed.data.planType;
  if (parsed.data.phoneNumberId !== undefined) updates.phoneNumberId = parsed.data.phoneNumberId;
  if (parsed.data.callLimit !== undefined) updates.callLimit = parsed.data.callLimit;

  try {
    const [client] = await db.update(clientsTable).set(updates).where(eq(clientsTable.id, params.data.id)).returning();
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }
    res.json(mapClient(client));
  } catch (err: any) {
    if (err?.code === "23505") { res.status(400).json({ error: "Client code already exists" }); return; }
    req.log.error({ err }, "Failed to update client");
    res.status(500).json({ error: "Internal server error" });
  }
});

adminClientsRouter.delete("/admin/clients/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteAdminClientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid client ID" }); return; }
  try {
    const [deleted] = await db.delete(clientsTable).where(eq(clientsTable.id, params.data.id)).returning();
    if (!deleted) { res.status(404).json({ error: "Client not found" }); return; }
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, "Failed to delete client");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default adminClientsRouter;
