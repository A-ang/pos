import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vehiclesTable } from "./vehicles";
import { customersTable } from "./customers";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id),
  rentalType: text("rental_type").notNull().default("self_drive"),
  status: text("status").notNull().default("pending"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  startKm: integer("start_km"),
  endKm: integer("end_km"),
  baseAmount: numeric("base_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  lateFee: numeric("late_fee", { precision: 15, scale: 2 }).default("0"),
  washFee: numeric("wash_fee", { precision: 15, scale: 2 }).default("0"),
  damageFee: numeric("damage_fee", { precision: 15, scale: 2 }).default("0"),
  otherFee: numeric("other_fee", { precision: 15, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
