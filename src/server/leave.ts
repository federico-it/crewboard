import "server-only";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { leaveRequestInputSchema, type LeaveRequest } from "@/features/leave/model";
import { getDatabase } from "./db/connection";
import { leaveRequests } from "./db/schema";
import { requireEmployee } from "./attendance";
import { HttpError } from "./http";

type Actor = Awaited<ReturnType<typeof requireEmployee>>;

function mapLeave(row: typeof leaveRequests.$inferSelect): LeaveRequest {
  return {
    id: row.id,
    startDate: row.startDate,
    endDate: row.endDate,
    type: row.type as LeaveRequest["type"],
    status: row.status as LeaveRequest["status"],
    note: row.note ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function readLeaveRequests(actor: Actor) {
  const rows = await getDatabase().db.select().from(leaveRequests)
    .where(eq(leaveRequests.employeeId, actor.id))
    .orderBy(desc(leaveRequests.createdAt));
  return { requests: rows.map(mapLeave) };
}

export async function createLeaveRequest(actor: Actor, input: unknown) {
  const value = leaveRequestInputSchema.parse(input);
  const [saved] = await getDatabase().db.insert(leaveRequests).values({
    id: randomUUID(),
    employeeId: actor.id,
    type: value.type,
    startDate: value.startDate,
    endDate: value.endDate,
    status: "pending",
    note: value.note ?? null,
  }).returning();
  if (!saved) throw new HttpError(500, "SERVER_ERROR", "The leave request could not be saved.");
  return mapLeave(saved);
}
