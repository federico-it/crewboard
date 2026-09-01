import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { attendanceInputSchema, summarizeAttendance, summaryInputSchema } from "@/features/attendance/model";
import { getDatabase } from "./db/connection";
import { attendanceRecords, employees, organizations } from "./db/schema";
import { getAuth } from "./auth";
import { HttpError } from "./http";

export async function requireEmployee(headers: Headers, checkContext = false) {
  const session = await getAuth().api.getSession({ headers });
  if (!session) throw new HttpError(401, "UNAUTHENTICATED", "Your session has expired. Please sign in again.");
  if (checkContext && headers.get("x-crewboard-session") !== session.session.id) {
    throw new HttpError(401, "SESSION_CHANGED", "Your session changed. Reload the page and sign in again.");
  }
  const [employee] = await getDatabase().db.select({
    id: employees.id,
    organizationId: employees.organizationId,
    organization: organizations.name,
    timezone: organizations.timezone,
    role: employees.role,
  }).from(employees).innerJoin(organizations, eq(employees.organizationId, organizations.id))
    .where(and(eq(employees.userId, session.user.id), eq(employees.active, true))).limit(1);
  if (!employee) throw new HttpError(403, "FORBIDDEN", "No active employee profile is available for this account.");
  return { ...employee, name: session.user.name, sessionContext: session.session.id };
}
type Actor = Awaited<ReturnType<typeof requireEmployee>>;

export async function readAttendance(actor: Actor, input: unknown) {
  const { month } = summaryInputSchema.parse(input);
  const lastDay = new Date(`${month}-01T12:00:00Z`);
  if (Number.isNaN(lastDay.getTime())) throw new HttpError(400, "INVALID_INPUT", "Invalid month.");
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
  const rows = await getDatabase().db.select({
    date: attendanceRecords.date, start: attendanceRecords.start, end: attendanceRecords.end,
    breakMinutes: attendanceRecords.breakMinutes, version: attendanceRecords.version,
  }).from(attendanceRecords).where(and(
    eq(attendanceRecords.employeeId, actor.id),
    gte(attendanceRecords.date, `${month}-01`), lte(attendanceRecords.date, lastDay.toISOString().slice(0, 10)),
  )).orderBy(asc(attendanceRecords.date));
  const records = rows.map((row) => ({ ...row, start: row.start.slice(0, 5), end: row.end?.slice(0, 5) ?? null }));
  return { records, summary: summarizeAttendance(month, records, actor.timezone) };
}

export async function saveAttendance(actor: Actor, input: unknown) {
  const value = attendanceInputSchema.parse(input);
  const db = getDatabase().db;
  let saved;
  if (value.version === 0) {
    [saved] = await db.insert(attendanceRecords).values({
      id: randomUUID(), employeeId: actor.id, ...value, version: 1,
    }).onConflictDoNothing({ target: [attendanceRecords.employeeId, attendanceRecords.date] }).returning({ date: attendanceRecords.date });
  } else {
    [saved] = await db.update(attendanceRecords).set({
      start: value.start, end: value.end, breakMinutes: value.breakMinutes,
      version: sql`${attendanceRecords.version} + 1`, updatedAt: new Date(),
    }).where(and(eq(attendanceRecords.employeeId, actor.id), eq(attendanceRecords.date, value.date), eq(attendanceRecords.version, value.version)))
      .returning({ date: attendanceRecords.date });
  }
  if (!saved) throw new HttpError(409, "CONFLICT", "This day changed in another session. Reload the month before editing again.");
  return { date: saved.date };
}
