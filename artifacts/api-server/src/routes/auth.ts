import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const authRouter = Router();

// GET /api/auth/me — returns current user role; provisions user on first visit
authRouter.get("/auth/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const clerkUserId = auth.userId;

  try {
    // Count total users — first user ever becomes admin
    const [{ value: totalUsers }] = await db.select({ value: count() }).from(usersTable);
    const isFirstUser = Number(totalUsers) === 0;

    let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, clerkUserId));

    if (!user) {
      const role = isFirstUser ? "admin" : "client";
      [user] = await db
        .insert(usersTable)
        .values({ clerkUserId, role })
        .returning();
      logger.info({ clerkUserId, role }, "Provisioned new user");
    }

    res.json({
      role: user.role,
      clerkUserId: user.clerkUserId,
      email: user.email ?? null,
      isFirstUser,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get auth/me");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default authRouter;
