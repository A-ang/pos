import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, maintenanceLogsTable } from "@workspace/db";
import {
  CreateMaintenanceLogBody,
  ListMaintenanceLogsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/vehicles/:vehicleId/maintenance", async (req, res): Promise<void> => {
  const params = ListMaintenanceLogsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const logs = await db.select().from(maintenanceLogsTable)
    .where(eq(maintenanceLogsTable.vehicleId, params.data.vehicleId))
    .orderBy(maintenanceLogsTable.createdAt);

  res.json(logs.map(formatLog));
});

router.post("/vehicles/:vehicleId/maintenance", async (req, res): Promise<void> => {
  const params = ListMaintenanceLogsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateMaintenanceLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [log] = await db.insert(maintenanceLogsTable).values({
    vehicleId: params.data.vehicleId,
    type: parsed.data.type,
    description: parsed.data.description,
    cost: parsed.data.cost != null ? String(parsed.data.cost) : null,
    dueDate: parsed.data.dueDate != null ? new Date(parsed.data.dueDate) : null,
    completedAt: parsed.data.completedAt != null ? new Date(parsed.data.completedAt) : null,
  }).returning();

  res.status(201).json(formatLog(log));
});

function formatLog(l: typeof maintenanceLogsTable.$inferSelect) {
  return {
    id: l.id,
    vehicleId: l.vehicleId,
    type: l.type,
    description: l.description,
    cost: l.cost != null ? parseFloat(l.cost) : null,
    dueDate: l.dueDate ? l.dueDate.toISOString() : null,
    completedAt: l.completedAt ? l.completedAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
  };
}

export default router;
