import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TeamLeaveWorkspace } from "@/features/team/leave-workspace";
import { requireEmployee } from "@/server/attendance";
import { readTeamLeaveRequests } from "@/server/leave";
import { HttpError } from "@/server/http";
import "@/features/leave/leave.css";

export default async function TeamLeavePage() {
  const requestHeaders = await headers();
  const actor = await requireEmployee(requestHeaders).catch((error: unknown) => {
    if (error instanceof HttpError && error.status === 401) redirect("/login");
    throw error;
  });
  const initial = await readTeamLeaveRequests(actor);
  return (
    <TeamLeaveWorkspace
      employee={{
        name: actor.name,
        organization: actor.organization,
        timezone: actor.timezone,
        sessionContext: actor.sessionContext,
        role: actor.role as "employee" | "manager" | "admin",
      }}
      initial={initial}
    />
  );
}
