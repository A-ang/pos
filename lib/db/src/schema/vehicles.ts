import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vehiclesTable = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  plateNumber: text("plate_number").notNull().unique(),
  year: integer("year").notNull(),
  color: text("color").notNull(),
  status: text("status").notNull().default("available"),
  ownership: text("ownership").notNull().default("internal"),
  partnerName: text("partner_name"),
  dailyRate: numeric("daily_rate", { precision: 15, scale: 2 }).notNull(),
  profitSharePercent: numeric("profit_share_percent", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
