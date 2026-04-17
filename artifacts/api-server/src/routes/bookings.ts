import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, bookingsTable, vehiclesTable, customersTable, transactionsTable, activityLogsTable } from "@workspace/db";
import {
  CreateBookingBody,
  UpdateBookingBody,
  GetBookingParams,
  UpdateBookingParams,
  ListBookingsQueryParams,
  CheckinBookingParams,
  CheckoutBookingParams,
  CheckinBookingBody,
  CheckoutBookingBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bookings", async (req, res): Promise<void> => {
  const params = ListBookingsQueryParams.safeParse(req.query);

  const allBookings = await db
    .select({
      booking: bookingsTable,
      customerName: customersTable.name,
      vehicleName: vehiclesTable.name,
      vehiclePlate: vehiclesTable.plateNumber,
    })
    .from(bookingsTable)
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
    .orderBy(bookingsTable.createdAt);

  let filtered = allBookings;

  if (params.success) {
    if (params.data.status) {
      filtered = filtered.filter(b => b.booking.status === params.data.status);
    }
    if (params.data.vehicleId) {
      filtered = filtered.filter(b => b.booking.vehicleId === params.data.vehicleId);
    }
    if (params.data.startDate) {
      const start = new Date(params.data.startDate);
      filtered = filtered.filter(b => b.booking.startDate >= start);
    }
    if (params.data.endDate) {
      const end = new Date(params.data.endDate);
      filtered = filtered.filter(b => b.booking.endDate <= end);
    }
  }

  res.json(filtered.map(r => formatBooking(r.booking, r.customerName ?? "", r.vehicleName ?? "", r.vehiclePlate ?? "")));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.vehicleId));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, parsed.data.customerId));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const baseAmount = parseFloat(vehicle.dailyRate) * days;

  const [booking] = await db.insert(bookingsTable).values({
    customerId: parsed.data.customerId,
    vehicleId: parsed.data.vehicleId,
    rentalType: parsed.data.rentalType,
    status: "pending",
    startDate: start,
    endDate: end,
    baseAmount: String(baseAmount),
    totalAmount: String(baseAmount),
    notes: parsed.data.notes ?? null,
  }).returning();

  await db.update(customersTable).set({ totalBookings: customer.totalBookings + 1 }).where(eq(customersTable.id, customer.id));

  await db.insert(activityLogsTable).values({
    type: "booking_created",
    description: `Reservasi baru: ${customer.name} - ${vehicle.name} (${vehicle.plateNumber})`,
    relatedId: booking.id,
  });

  res.status(201).json(formatBooking(booking, customer.name, vehicle.name, vehicle.plateNumber));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      booking: bookingsTable,
      customerName: customersTable.name,
      vehicleName: vehiclesTable.name,
      vehiclePlate: vehiclesTable.plateNumber,
    })
    .from(bookingsTable)
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
    .where(eq(bookingsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(formatBooking(row.booking, row.customerName ?? "", row.vehicleName ?? "", row.vehiclePlate ?? ""));
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  const data = parsed.data;
  if (data.status !== undefined) updates.status = data.status;
  if (data.rentalType !== undefined) updates.rentalType = data.rentalType;
  if (data.startDate !== undefined) updates.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updates.endDate = new Date(data.endDate);
  if (data.notes !== undefined) updates.notes = data.notes;

  const [booking] = await db.update(bookingsTable).set(updates).where(eq(bookingsTable.id, params.data.id)).returning();
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [row] = await db
    .select({ customerName: customersTable.name, vehicleName: vehiclesTable.name, vehiclePlate: vehiclesTable.plateNumber })
    .from(bookingsTable)
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
    .where(eq(bookingsTable.id, booking.id));

  res.json(formatBooking(booking, row?.customerName ?? "", row?.vehicleName ?? "", row?.vehiclePlate ?? ""));
});

router.post("/bookings/:id/checkin", async (req, res): Promise<void> => {
  const params = CheckinBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CheckinBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .select({ booking: bookingsTable, customerName: customersTable.name, vehicleName: vehiclesTable.name, vehiclePlate: vehiclesTable.plateNumber })
    .from(bookingsTable)
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
    .where(eq(bookingsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [booking] = await db.update(bookingsTable).set({
    status: "active",
    startKm: parsed.data.startKm,
  }).where(eq(bookingsTable.id, params.data.id)).returning();

  await db.update(vehiclesTable).set({ status: "rented" }).where(eq(vehiclesTable.id, row.booking.vehicleId));

  await db.insert(activityLogsTable).values({
    type: "checkin",
    description: `Check-in: ${row.customerName} - ${row.vehicleName} (KM: ${parsed.data.startKm})`,
    relatedId: booking.id,
  });

  res.json(formatBooking(booking, row.customerName ?? "", row.vehicleName ?? "", row.vehiclePlate ?? ""));
});

router.post("/bookings/:id/checkout", async (req, res): Promise<void> => {
  const params = CheckoutBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CheckoutBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .select({ booking: bookingsTable, customerName: customersTable.name, vehicleName: vehiclesTable.name, vehiclePlate: vehiclesTable.plateNumber })
    .from(bookingsTable)
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
    .where(eq(bookingsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const lateFee = parsed.data.lateFee ?? 0;
  const washFee = parsed.data.washFee ?? 0;
  const damageFee = parsed.data.damageFee ?? 0;
  const otherFee = parsed.data.otherFee ?? 0;
  const baseAmount = parseFloat(row.booking.baseAmount);
  const totalAmount = baseAmount + lateFee + washFee + damageFee + otherFee;

  const [booking] = await db.update(bookingsTable).set({
    status: "completed",
    endKm: parsed.data.endKm,
    lateFee: String(lateFee),
    washFee: String(washFee),
    damageFee: String(damageFee),
    otherFee: String(otherFee),
    totalAmount: String(totalAmount),
    notes: parsed.data.notes ?? row.booking.notes,
  }).where(eq(bookingsTable.id, params.data.id)).returning();

  await db.update(vehiclesTable).set({ status: "available" }).where(eq(vehiclesTable.id, row.booking.vehicleId));

  const invoiceNumber = `INV-${Date.now()}`;
  const [tx] = await db.insert(transactionsTable).values({
    bookingId: booking.id,
    invoiceNumber,
    amount: String(totalAmount),
    paidAmount: "0",
    status: "unpaid",
  }).returning();

  await db.insert(activityLogsTable).values({
    type: "checkout",
    description: `Check-out: ${row.customerName} - ${row.vehicleName} (Total: Rp ${totalAmount.toLocaleString('id-ID')})`,
    relatedId: booking.id,
  });

  res.json(formatBooking(booking, row.customerName ?? "", row.vehicleName ?? "", row.vehiclePlate ?? ""));
});

function formatBooking(
  b: typeof bookingsTable.$inferSelect,
  customerName: string,
  vehicleName: string,
  vehiclePlate: string,
) {
  return {
    id: b.id,
    customerId: b.customerId,
    vehicleId: b.vehicleId,
    customerName,
    vehicleName,
    vehiclePlate,
    rentalType: b.rentalType,
    status: b.status,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    startKm: b.startKm,
    endKm: b.endKm,
    baseAmount: parseFloat(b.baseAmount),
    lateFee: b.lateFee != null ? parseFloat(b.lateFee) : null,
    washFee: b.washFee != null ? parseFloat(b.washFee) : null,
    damageFee: b.damageFee != null ? parseFloat(b.damageFee) : null,
    otherFee: b.otherFee != null ? parseFloat(b.otherFee) : null,
    totalAmount: parseFloat(b.totalAmount),
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
  };
}

export default router;
