/**
 * Leads routes
 *
 * Clients upload a CSV → server parses it, inserts leads, fires VAPI outbound
 * calls for each one. VAPI webhook at /api/webhooks/vapi updates lead status.
 */
import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { db, clientsTable, leadsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";
import { logger } from "../lib/logger.js";

const leadsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ─── helpers ────────────────────────────────────────────────────────────────

function mapLead(l: typeof leadsTable.$inferSelect) {
  return {
    id: l.id,
    clientId: l.clientId,
    firstName: l.firstName,
    lastName: l.lastName ?? null,
    phone: l.phone,
    email: l.email ?? null,
    notes: l.notes ?? null,
    status: l.status,
    vapiCallId: l.vapiCallId ?? null,
    callSummary: l.callSummary ?? null,
    callSentiment: l.callSentiment ?? null,
    callDurationSeconds: l.callDurationSeconds ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

/** Parse CSV text → array of row objects. First row = headers. */
function parseCsv(text: string): { firstName: string; lastName?: string; phone: string; email?: string; notes?: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).flatMap((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });

    const phone = row["phone"] || row["phonenumber"] || row["mobile"] || row["number"] || "";
    const firstName = row["firstname"] || row["first"] || row["name"] || "";
    if (!phone || !firstName) return [];
    return [{
      firstName,
      lastName: row["lastname"] || row["last"] || undefined,
      phone,
      email: row["email"] || undefined,
      notes: row["notes"] || row["note"] || undefined,
    }];
  });
}

/** Place a VAPI outbound call for a single lead; returns vapiCallId or throws. */
async function placeVapiCall(
  assistantId: string,
  phoneNumberId: string,
  lead: { firstName: string; lastName?: string | null; phone: string },
): Promise<string> {
  const vapiKey = process.env["VAPI_API_KEY"];
  if (!vapiKey) throw new Error("VAPI_API_KEY not set");

  const res = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: { Authorization: `Bearer ${vapiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: {
        number: lead.phone,
        name: `${lead.firstName}${lead.lastName ? " " + lead.lastName : ""}`,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VAPI ${res.status}: ${text}`);
  }
  const data = await res.json() as { id: string };
  return data.id;
}

// ─── routes ─────────────────────────────────────────────────────────────────

// GET /api/clients/me/leads — client views their leads
leadsRouter.get("/clients/me/leads", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as any).clerkUserId as string;
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.clerkUserId, clerkUserId));
  if (!client) { res.status(404).json({ error: "No client record found" }); return; }
  const leads = await db.select().from(leadsTable).where(eq(leadsTable.clientId, client.id))
    .orderBy(leadsTable.createdAt);
  res.json(leads.map(mapLead));
});

// POST /api/clients/me/leads/upload — client uploads CSV, VAPI auto-calls each row
leadsRouter.post(
  "/clients/me/leads/upload",
  requireAuth,
  upload.single("file"),
  async (req, res): Promise<void> => {
    const clerkUserId = (req as any).clerkUserId as string;
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.clerkUserId, clerkUserId));
    if (!client) { res.status(404).json({ error: "No client record found" }); return; }

    if (client.planType === "inbound") {
      res.status(400).json({ error: "Outbound calling is not enabled on your plan" });
      return;
    }

    if (!client.phoneNumberId) {
      res.status(400).json({ error: "Outbound calling is not yet configured. Contact support to enable it." });
      return;
    }

    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }

    const text = req.file.buffer.toString("utf-8");
    const rows = parseCsv(text);
    if (rows.length === 0) {
      res.status(400).json({ error: "No valid leads found. Ensure CSV has headers: firstName, phone (required), lastName, email, notes (optional)" });
      return;
    }

    let inserted = 0, queued = 0, errors = 0;

    // Insert all leads first
    const inserted_leads: typeof leadsTable.$inferSelect[] = [];
    for (const row of rows) {
      try {
        const [lead] = await db.insert(leadsTable).values({
          clientId: client.id,
          firstName: row.firstName,
          lastName: row.lastName ?? null,
          phone: row.phone,
          email: row.email ?? null,
          notes: row.notes ?? null,
          status: "pending",
        }).returning();
        inserted_leads.push(lead);
        inserted++;
      } catch (err) {
        logger.warn({ err, row }, "Failed to insert lead row");
        errors++;
      }
    }

    // Fire VAPI calls in background — don't block the response
    res.json({
      inserted,
      queued: inserted,
      errors,
      message: `${inserted} leads uploaded. VAPI is now calling each one automatically.`,
    });

    // Trigger calls after response is sent
    for (const lead of inserted_leads) {
      try {
        await db.update(leadsTable).set({ status: "calling" }).where(eq(leadsTable.id, lead.id));
        const vapiCallId = await placeVapiCall(client.assistantId, client.phoneNumberId!, lead);
        await db.update(leadsTable).set({ status: "called", vapiCallId }).where(eq(leadsTable.id, lead.id));
        queued++;
        logger.info({ leadId: lead.id, vapiCallId }, "Outbound call placed");
      } catch (err) {
        logger.error({ err, leadId: lead.id }, "Failed to place VAPI call for lead");
        await db.update(leadsTable).set({ status: "failed" }).where(eq(leadsTable.id, lead.id));
      }
    }
  },
);

// POST /api/webhooks/vapi — VAPI sends call lifecycle events here
// Register this URL in your VAPI dashboard: <your-domain>/api/webhooks/vapi
leadsRouter.post("/webhooks/vapi", async (req, res): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;
    const msg = (body["message"] ?? body) as Record<string, unknown>;
    const type = (msg["type"] as string) ?? "";

    logger.debug({ type }, "VAPI webhook received");

    if (type === "end-of-call-report" || type === "call.ended") {
      const call = (msg["call"] ?? msg) as Record<string, unknown>;
      const callId = call["id"] as string | undefined;
      const analysis = msg["analysis"] as Record<string, unknown> | undefined;
      const endedReason = call["endedReason"] as string | undefined;

      if (callId) {
        const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.vapiCallId, callId));
        if (lead) {
          const summary = (analysis?.["summary"] as string) ?? null;
          const evaluation = (analysis?.["successEvaluation"] as string) ?? null;
          let sentiment: string | null = null;
          if (evaluation) {
            const score = parseFloat(evaluation);
            if (!isNaN(score)) {
              sentiment = score >= 0.7 ? "positive" : score >= 0.4 ? "neutral" : "negative";
            } else {
              const ev = evaluation.toLowerCase();
              sentiment = ev.includes("success") || ev.includes("positive") ? "positive"
                : ev.includes("fail") || ev.includes("negative") ? "negative" : "neutral";
            }
          }

          const startedAt = call["startedAt"] as string | undefined;
          const endedAt = call["endedAt"] as string | undefined;
          let duration: number | null = null;
          if (startedAt && endedAt) {
            duration = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
          }

          const failed = endedReason && ["error", "failed", "no-answer"].some((s) => endedReason.includes(s));
          const newStatus = failed ? "failed" : "completed";

          await db.update(leadsTable)
            .set({ status: newStatus, callSummary: summary, callSentiment: sentiment, callDurationSeconds: duration })
            .where(eq(leadsTable.id, lead.id));

          logger.info({ leadId: lead.id, callId, newStatus }, "Lead updated from VAPI webhook");
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Error processing VAPI webhook");
    res.json({ received: true }); // Always 200 to VAPI
  }
});

export default leadsRouter;
