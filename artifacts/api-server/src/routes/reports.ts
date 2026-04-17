import { Router, type IRouter } from "express";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { db, bookingsTable, transactionsTable, vehiclesTable, customersTable, activityLogsTable } from "@workspace/db";
import {
  GetRevenueReportQueryParams,
  GetVehicleUtilizationReportQueryParams,
  GetPartnerReportQueryParams,
  GetRecentActivityQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reports/dashboard", async (_req, res): Promise<void> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [vehicleCounts] = await db.select({
    total: sql<number>`count(*)::int`,
    available: sql<number>`count(*) filter (where status = 'available')::int`,
    rented: sql<number>`count(*) filter (where status = 'rented')::int`,
    maintenance: sql<number>`count(*) filter (where status = 'maintenance')::int`,
  }).from(vehiclesTable);

  const [bookingCounts] = await db.select({
    active: sql<number>`count(*) filter (where status = 'active')::int`,
    pending: sql<number>`count(*) filter (where status = 'pending')::int`,
  }).from(bookingsTable);

  const [revMonth] = await db.select({
    total: sql<number>`coalesce(sum(paid_amount), 0)::float`,
  }).from(transactionsTable).where(gte(transactionsTable.createdAt, startOfMonth));

  const [revToday] = await db.select({
    total: sql<number>`coalesce(sum(paid_amount), 0)::float`,
  }).from(transactionsTable).where(gte(transactionsTable.createdAt, startOfDay));

  const [unpaidCount] = await db.select({
    count: sql<number>`count(*)::int`,
  }).from(transactionsTable).where(eq(transactionsTable.status, "unpaid"));

  const [customerCount] = await db.select({
    count: sql<number>`count(*)::int`,
  }).from(customersTable);

  res.json({
    totalVehicles: vehicleCounts.total,
    availableVehicles: vehicleCounts.available,
    rentedVehicles: vehicleCounts.rented,
    maintenanceVehicles: vehicleCounts.maintenance,
    activeBookings: bookingCounts.active,
    pendingBookings: bookingCounts.pending,
    totalRevenueThisMonth: revMonth.total,
    totalRevenueToday: revToday.total,
    unpaidInvoices: unpaidCount.count,
    totalCustomers: customerCount.count,
  });
});

router.get("/reports/revenue", async (req, res): Promise<void> => {
  const params = GetRevenueReportQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const start = new Date(params.data.startDate);
  const end = new Date(params.data.endDate);
  const groupBy = params.data.groupBy ?? "day";

  let truncFormat = "day";
  if (groupBy === "week") truncFormat = "week";
  else if (groupBy === "month") truncFormat = "month";

  const rows = await db.select({
    period: sql<string>`date_trunc(${truncFormat}, created_at)::date::text`,
    revenue: sql<number>`coalesce(sum(paid_amount), 0)::float`,
    bookingCount: sql<number>`count(distinct booking_id)::int`,
  }).from(transactionsTable)
    .where(and(gte(transactionsTable.createdAt, start), lte(transactionsTable.createdAt, end)))
    .groupBy(sql`date_trunc(${truncFormat}, created_at)`)
    .orderBy(sql`date_trunc(${truncFormat}, created_at)`);

  res.json(rows);
});

router.get("/reports/vehicles", async (req, res): Promise<void> => {
  const params = GetVehicleUtilizationReportQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const start = new Date(params.data.startDate);
  const end = new Date(params.data.endDate);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const vehicles = await db.select().from(vehiclesTable);
  const results = [];

  for (const v of vehicles) {
    const bookings = await db.select().from(bookingsTable)
      .where(and(
        eq(bookingsTable.vehicleId, v.id),
        eq(bookingsTable.status, "completed"),
        gte(bookingsTable.startDate, start),
        lte(bookingsTable.endDate, end),
      ));

    const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
    const utilizationDays = bookings.reduce((sum, b) => {
      const days = Math.ceil((b.endDate.getTime() - b.startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    results.push({
      vehicleId: v.id,
      vehicleName: v.name,
      plateNumber: v.plateNumber,
      ownership: v.ownership,
      totalBookings: bookings.length,
      totalRevenue,
      utilizationDays,
      utilizationPercent: Math.min(100, Math.round((utilizationDays / totalDays) * 100)),
    });
  }

  res.json(results.sort((a, b) => b.totalRevenue - a.totalRevenue));
});

router.get("/reports/partners", async (req, res): Promise<void> => {
  const params = GetPartnerReportQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const start = new Date(params.data.startDate);
  const end = new Date(params.data.endDate);

  const externalVehicles = await db.select().from(vehiclesTable).where(eq(vehiclesTable.ownership, "external"));
  const results = [];

  for (const v of externalVehicles) {
    const bookings = await db.select().from(bookingsTable)
      .where(and(
        eq(bookingsTable.vehicleId, v.id),
        eq(bookingsTable.status, "completed"),
        gte(bookingsTable.startDate, start),
        lte(bookingsTable.endDate, end),
      ));

    const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
    const operationalCost = bookings.reduce((sum, b) => {
      const wash = b.washFee ? parseFloat(b.washFee) : 0;
      const damage = b.damageFee ? parseFloat(b.damageFee) : 0;
      return sum + wash + damage;
    }, 0);
    const netRevenue = totalRevenue - operationalCost;
    const profitSharePercent = v.profitSharePercent ? parseFloat(v.profitSharePercent) : 70;
    const partnerShare = netRevenue * (profitSharePercent / 100);
    const companyShare = netRevenue - partnerShare;

    results.push({
      vehicleId: v.id,
      vehicleName: v.name,
      plateNumber: v.plateNumber,
      partnerName: v.partnerName ?? "Mitra",
      totalRevenue,
      operationalCost,
      netRevenue,
      partnerShare,
      companyShare,
      profitSharePercent,
    });
  }

  res.json(results);
});

router.get("/reports/recent-activity", async (req, res): Promise<void> => {
  const params = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = params.success && params.data.limit ? params.data.limit : 20;

  const activities = await db.select().from(activityLogsTable)
    .orderBy(sql`created_at desc`)
    .limit(limit);

  res.json(activities.map(a => ({
    id: a.id,
    type: a.type,
    description: a.description,
    relatedId: a.relatedId,
    createdAt: a.createdAt.toISOString(),
  })));
});

export default router;
