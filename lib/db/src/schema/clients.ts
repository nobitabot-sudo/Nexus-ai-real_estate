import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";

export const planTypeEnum = pgEnum("plan_type", ["inbound", "outbound", "combo"]);
export const leadStatusEnum = pgEnum("lead_status", ["pending", "calling", "called", "completed", "failed", "dnc"]);

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  clientCode: text("client_code").notNull().unique(),
  name: text("name").notNull(),
  assistantId: text("assistant_id").notNull(),
  niche: text("niche"),
  planType: planTypeEnum("plan_type").notNull().default("inbound"),
  phoneNumberId: text("phone_number_id"),
  callLimit: integer("call_limit"),
  clerkUserId: text("clerk_user_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const usersTable = pgTable("users", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  email: text("email"),
  role: text("role").notNull().default("client"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  status: leadStatusEnum("status").notNull().default("pending"),
  vapiCallId: text("vapi_call_id"),
  // Call outcome — populated by VAPI webhook
  callSummary: text("call_summary"),
  callSentiment: text("call_sentiment"),
  callDurationSeconds: integer("call_duration_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Client = typeof clientsTable.$inferSelect;
export type InsertClient = typeof clientsTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;
export type Lead = typeof leadsTable.$inferSelect;
export type InsertLead = typeof leadsTable.$inferInsert;
