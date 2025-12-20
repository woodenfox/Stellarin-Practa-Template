import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const devices = pgTable("devices", {
  anonymousId: varchar("anonymous_id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const riceContributions = pgTable("rice_contributions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  anonymousId: varchar("anonymous_id")
    .notNull()
    .references(() => devices.anonymousId),
  amount: integer("amount").notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("rice_contributions_anonymous_id_idx").on(table.anonymousId),
  index("rice_contributions_created_at_idx").on(table.createdAt),
]);

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDeviceSchema = createInsertSchema(devices).pick({
  anonymousId: true,
});

export const insertRiceContributionSchema = createInsertSchema(riceContributions).pick({
  anonymousId: true,
  amount: true,
  source: true,
}).refine((data) => data.amount > 0 && data.amount <= 1000, {
  message: "Amount must be between 1 and 1000",
  path: ["amount"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type RiceContribution = typeof riceContributions.$inferSelect;
export type InsertRiceContribution = z.infer<typeof insertRiceContributionSchema>;
