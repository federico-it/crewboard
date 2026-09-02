import { headers } from "next/headers";
import { OverviewDashboard } from "@/features/overview/overview-dashboard";
import { requireEmployee, readAttendance } from "@/server/attendance";
import { readLeaveRequests } from "@/server/leave";

export default async function OverviewPage() {
  const requestHeaders = await headers();
  const actor = await requireEmployee(requestHeaders);
  const [attendance, leave] = await Promise.all([
    readAttendance(actor, { month: "2026-08" }),
    readLeaveRequests(actor),
  ]);

  return (
    <OverviewDashboard
      employee={{
        name: actor.name,
        organization: actor.organization,
        role: actor.role as "employee" | "manager" | "admin",
      }}
      summary={attendance.summary}
      requests={leave.requests}
    />
  );
}
