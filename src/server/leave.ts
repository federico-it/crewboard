import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, ne } from "drizzle-orm";
import { approveLeaveInputSchema, leaveRequestInputSchema, type LeaveRequest, type TeamLeaveRequest } from "@/features/leave/model";
import { getDatabase } from "./db/connection";
import { employees, leaveRequests, user } from "./db/schema";
import { requireEmployee } from "./attendance";
import { HttpError } from "./http";

type Actor = Awaited<ReturnType<typeof requireEmployee>>;

function assertManager(actor: Actor) {
  if (actor.role !== "manager" && actor.role !== "admin") {
    throw new HttpError(403, "FORBIDDEN", "Only managers can access team leave requests.");
  }
}

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

export async function readTeamLeaveRequests(actor: Actor) {
  assertManager(actor);
  const rows = await getDatabase().db.select({
    request: leaveRequests,
    employeeName: user.name,
    employeeOrganizationId: employees.organizationId,
    employeeId: employees.id,
  }).from(leaveRequests)
    .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .innerJoin(user, eq(employees.userId, user.id))
    .where(and(eq(employees.organizationId, actor.organizationId), ne(employees.id, actor.id)))
    .orderBy(desc(leaveRequests.createdAt));
  return {
    requests: rows.map((row): TeamLeaveRequest => ({
      ...mapLeave(row.request),
      employeeName: row.employeeName,
    })),
  };
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

export async function approveLeaveRequest(actor: Actor, input: unknown) {
  assertManager(actor);
  const { requestId } = approveLeaveInputSchema.parse(input);
  const db = getDatabase().db;
  const [existing] = await db.select({
    request: leaveRequests,
    employeeOrganizationId: employees.organizationId,
    employeeId: employees.id,
  }).from(leaveRequests)
    .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .where(eq(leaveRequests.id, requestId))
    .limit(1);
  if (!existing) throw new HttpError(404, "NOT_FOUND", "Leave request not found.");
  if (existing.employeeOrganizationId !== actor.organizationId || existing.employeeId === actor.id) {
    throw new HttpError(403, "FORBIDDEN", "You cannot approve this leave request.");
  }
  if (existing.request.status !== "pending") {
    throw new HttpError(409, "CONFLICT", "Only pending requests can be approved.");
  }
  const [saved] = await db.update(leaveRequests).set({
    status: "approved",
    approvedBy: actor.id,
    updatedAt: new Date(),
  }).where(and(eq(leaveRequests.id, requestId), eq(leaveRequests.status, "pending")))
    .returning();
  if (!saved) throw new HttpError(409, "CONFLICT", "This request changed before approval completed.");
  return mapLeave(saved);
}
