import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();

const authRouter = Router();

authRouter.get("/auth/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const clerkUserId = auth.userId;

  try {
    let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, clerkUserId));

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() ?? null;

      const role = ADMIN_EMAIL && email === ADMIN_EMAIL ? "admin" : "client";

      [user] = await db
        .insert(usersTable)
        .values({ clerkUserId, email, role })
        .returning();
      logger.info({ clerkUserId, role, email }, "Provisioned new user");
    }

    res.json({
      role: user.role,
      clerkUserId: user.clerkUserId,
      email: user.email ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get auth/me");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default authRouter;
