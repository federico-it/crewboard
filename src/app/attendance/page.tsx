import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AttendanceWorkspace } from "@/features/attendance/workspace";
import { requireEmployee, readAttendance } from "@/server/attendance";
import { HttpError } from "@/server/http";
import "@/features/attendance/attendance.css";

export default async function AttendancePage() {
  const requestHeaders = await headers();
  const actor = await requireEmployee(requestHeaders).catch((error: unknown) => {
    if (error instanceof HttpError && error.status === 401) redirect("/login");
    throw error;
  });
  const initial = await readAttendance(actor, { month: "2026-08" });
  return <AttendanceWorkspace employee={{ name: actor.name, organization: actor.organization, timezone: actor.timezone, sessionContext: actor.sessionContext }} initial={initial} />;
}
