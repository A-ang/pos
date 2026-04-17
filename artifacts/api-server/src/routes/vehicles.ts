import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vehiclesTable } from "@workspace/db";
import {
  CreateVehicleBody,
  UpdateVehicleBody,
  GetVehicleParams,
  UpdateVehicleParams,
  DeleteVehicleParams,
  ListVehiclesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/vehicles", async (req, res): Promise<void> => {
  const params = ListVehiclesQueryParams.safeParse(req.query);
  let query = db.select().from(vehiclesTable).$dynamic();

  if (params.success) {
    if (params.data.status) {
      query = query.where(eq(vehiclesTable.status, params.data.status));
    }
  }

  const vehicles = await query.orderBy(vehiclesTable.name);
  const filtered = params.success && params.data.ownership
    ? vehicles.filter(v => v.ownership === params.data.ownership)
    : vehicles;

  res.json(filtered.map(formatVehicle));
});

router.post("/vehicles", async (req, res): Promise<void> => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [vehicle] = await db.insert(vehiclesTable).values({
    name: data.name,
    plateNumber: data.plateNumber,
    year: data.year,
    color: data.color,
    status: data.status ?? "available",
    ownership: data.ownership,
    partnerName: data.partnerName ?? null,
    dailyRate: String(data.dailyRate),
    profitSharePercent: data.profitSharePercent != null ? String(data.profitSharePercent) : null,
    notes: data.notes ?? null,
  }).returning();

  res.status(201).json(formatVehicle(vehicle));
});

router.get("/vehicles/:id", async (req, res): Promise<void> => {
  const params = GetVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.id));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json(formatVehicle(vehicle));
});

router.patch("/vehicles/:id", async (req, res): Promise<void> => {
  const params = UpdateVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.plateNumber !== undefined) updates.plateNumber = data.plateNumber;
  if (data.year !== undefined) updates.year = data.year;
  if (data.color !== undefined) updates.color = data.color;
  if (data.status !== undefined) updates.status = data.status;
  if (data.ownership !== undefined) updates.ownership = data.ownership;
  if (data.partnerName !== undefined) updates.partnerName = data.partnerName;
  if (data.dailyRate !== undefined) updates.dailyRate = String(data.dailyRate);
  if (data.profitSharePercent !== undefined) updates.profitSharePercent = data.profitSharePercent != null ? String(data.profitSharePercent) : null;
  if (data.notes !== undefined) updates.notes = data.notes;

  const [vehicle] = await db.update(vehiclesTable).set(updates).where(eq(vehiclesTable.id, params.data.id)).returning();
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json(formatVehicle(vehicle));
});

router.delete("/vehicles/:id", async (req, res): Promise<void> => {
  const params = DeleteVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vehicle] = await db.delete(vehiclesTable).where(eq(vehiclesTable.id, params.data.id)).returning();
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.sendStatus(204);
});

function formatVehicle(v: typeof vehiclesTable.$inferSelect) {
  return {
    id: v.id,
    name: v.name,
    plateNumber: v.plateNumber,
    year: v.year,
    color: v.color,
    status: v.status,
    ownership: v.ownership,
    partnerName: v.partnerName,
    dailyRate: parseFloat(v.dailyRate),
    profitSharePercent: v.profitSharePercent != null ? parseFloat(v.profitSharePercent) : null,
    notes: v.notes,
    createdAt: v.createdAt.toISOString(),
  };
}

export default router;
