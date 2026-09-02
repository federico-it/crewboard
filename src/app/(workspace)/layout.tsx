import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireEmployee } from "@/server/attendance";
import { HttpError } from "@/server/http";
import "@/features/attendance/attendance.css";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const actor = await requireEmployee(requestHeaders).catch((error: unknown) => {
    if (error instanceof HttpError && error.status === 401) redirect("/login");
    throw error;
  });

  return (
    <WorkspaceShell
      employee={{
        name: actor.name,
        organization: actor.organization,
        role: actor.role as "employee" | "manager" | "admin",
      }}
    >
      {children}
    </WorkspaceShell>
  );
}
