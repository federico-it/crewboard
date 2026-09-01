import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LeaveWorkspace } from "@/features/leave/workspace";
import { requireEmployee } from "@/server/attendance";
import { readLeaveRequests } from "@/server/leave";
import { HttpError } from "@/server/http";
import "@/features/attendance/attendance.css";
import "@/features/leave/leave.css";

export default async function LeavePage() {
  const requestHeaders = await headers();
  const actor = await requireEmployee(requestHeaders).catch((error: unknown) => {
    if (error instanceof HttpError && error.status === 401) redirect("/login");
    throw error;
  });
  const initial = await readLeaveRequests(actor);
  return <LeaveWorkspace employee={{ name: actor.name, organization: actor.organization, timezone: actor.timezone, sessionContext: actor.sessionContext, role: actor.role as "employee" | "manager" | "admin" }} initial={initial} />;
}
