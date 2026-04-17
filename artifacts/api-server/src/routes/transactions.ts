import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, transactionsTable, bookingsTable, customersTable, vehiclesTable, activityLogsTable } from "@workspace/db";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  GetTransactionParams,
  UpdateTransactionParams,
  ListTransactionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transactions", async (req, res): Promise<void> => {
  const params = ListTransactionsQueryParams.safeParse(req.query);

  const allTx = await db
    .select({
      tx: transactionsTable,
      customerName: customersTable.name,
      vehicleName: vehiclesTable.name,
    })
    .from(transactionsTable)
    .leftJoin(bookingsTable, eq(transactionsTable.bookingId, bookingsTable.id))
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
    .orderBy(transactionsTable.createdAt);

  let filtered = allTx;
  if (params.success) {
    if (params.data.status) {
      filtered = filtered.filter(r => r.tx.status === params.data.status);
    }
    if (params.data.startDate) {
      const start = new Date(params.data.startDate);
      filtered = filtered.filter(r => r.tx.createdAt >= start);
    }
    if (params.data.endDate) {
      const end = new Date(params.data.endDate);
      filtered = filtered.filter(r => r.tx.createdAt <= end);
    }
  }

  res.json(filtered.map(r => formatTransaction(r.tx, r.customerName ?? "", r.vehicleName ?? "")));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const invoiceNumber = `INV-${Date.now()}`;
  const [tx] = await db.insert(transactionsTable).values({
    bookingId: parsed.data.bookingId,
    invoiceNumber,
    amount: String(parsed.data.amount),
    paidAmount: "0",
    status: "unpaid",
    notes: parsed.data.notes ?? null,
  }).returning();

  const [row] = await db
    .select({ customerName: customersTable.name, vehicleName: vehiclesTable.name })
    .from(bookingsTable)
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
    .where(eq(bookingsTable.id, parsed.data.bookingId));

  res.status(201).json(formatTransaction(tx, row?.customerName ?? "", row?.vehicleName ?? ""));
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      tx: transactionsTable,
      customerName: customersTable.name,
      vehicleName: vehiclesTable.name,
    })
    .from(transactionsTable)
    .leftJoin(bookingsTable, eq(transactionsTable.bookingId, bookingsTable.id))
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
    .where(eq(transactionsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(formatTransaction(row.tx, row.customerName ?? "", row.vehicleName ?? ""));
});

router.patch("/transactions/:id", async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  const data = parsed.data;
  if (data.paidAmount !== undefined) updates.paidAmount = String(data.paidAmount);
  if (data.status !== undefined) updates.status = data.status;
  if (data.paymentMethod !== undefined) updates.paymentMethod = data.paymentMethod;
  if (data.notes !== undefined) updates.notes = data.notes;
  if (data.status === "paid") updates.paidAt = new Date();

  const [tx] = await db.update(transactionsTable).set(updates).where(eq(transactionsTable.id, params.data.id)).returning();
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  if (data.status === "paid") {
    await db.insert(activityLogsTable).values({
      type: "payment",
      description: `Pembayaran diterima: ${tx.invoiceNumber} (Rp ${parseFloat(tx.paidAmount).toLocaleString('id-ID')})`,
      relatedId: tx.id,
    });
  }

  const [row] = await db
    .select({ customerName: customersTable.name, vehicleName: vehiclesTable.name })
    .from(bookingsTable)
    .leftJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .leftJoin(vehiclesTable, eq(bookingsTable.vehicleId, vehiclesTable.id))
    .where(eq(bookingsTable.id, tx.bookingId));

  res.json(formatTransaction(tx, row?.customerName ?? "", row?.vehicleName ?? ""));
});

function formatTransaction(tx: typeof transactionsTable.$inferSelect, customerName: string, vehicleName: string) {
  return {
    id: tx.id,
    bookingId: tx.bookingId,
    invoiceNumber: tx.invoiceNumber,
    customerName,
    vehicleName,
    amount: parseFloat(tx.amount),
    paidAmount: parseFloat(tx.paidAmount),
    status: tx.status,
    paymentMethod: tx.paymentMethod,
    paidAt: tx.paidAt ? tx.paidAt.toISOString() : null,
    notes: tx.notes,
    createdAt: tx.createdAt.toISOString(),
  };
}

export default router;
