import Link from "next/link";

export function WorkspaceNav({ role, current }: { role: "employee" | "manager" | "admin"; current: "attendance" | "leave" | "team" }) {
  const manager = role === "manager" || role === "admin";
  return <nav className="workspace-nav" aria-label="Workspace">
    <Link href="/attendance" aria-current={current === "attendance" ? "page" : undefined}>Attendance</Link>
    <Link href="/leave" aria-current={current === "leave" ? "page" : undefined}>Leave</Link>
    {manager && <Link href="/team/leave" aria-current={current === "team" ? "page" : undefined}>Team leave</Link>}
  </nav>;
}
