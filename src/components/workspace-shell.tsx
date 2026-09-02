"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { WorkspaceEmployee } from "@/features/workspace/types";

type NavItem = { name: string; href: string; planned?: boolean };

const PERSONAL_NAV: NavItem[] = [
  { name: "Overview", href: "/" },
  { name: "Attendance", href: "/attendance" },
  { name: "Leave", href: "/leave" },
  { name: "Payslips", href: "/payslips", planned: true },
  { name: "Profile", href: "/profile", planned: true },
];

const TEAM_NAV: NavItem[] = [
  { name: "Leave requests", href: "/team/leave" },
  { name: "Team attendance", href: "/team/attendance", planned: true },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Overview", subtitle: "Your workplace, agent-ready." },
  "/attendance": { title: "Attendance", subtitle: "Review your month and keep your agent in sync." },
  "/leave": { title: "Leave", subtitle: "Request time off and track your requests." },
  "/team/leave": { title: "Team leave", subtitle: "Review and approve pending team requests." },
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleLabel(role: WorkspaceEmployee["role"]) {
  if (role === "manager" || role === "admin") return "MANAGER";
  return "EMPLOYEE";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div>
      <p className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {items.map((item) => {
          const active = !item.planned && isActive(pathname, item.href);
          if (item.planned) {
            return (
              <li key={item.name}>
                <span className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-zinc-400">
                  {item.name}
                  <span className="rounded-full bg-zinc-500/10 px-1.5 py-0.5 text-[10px] font-medium">Soon</span>
                </span>
              </li>
            );
          }
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-2 py-1.5 text-sm ${
                  active
                    ? "bg-zinc-900 font-medium text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.06]"
                }`}
              >
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function WorkspaceShell({ employee, children }: { employee: WorkspaceEmployee; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const meta = PAGE_META[pathname] ?? { title: "Crewboard", subtitle: employee.organization };
  const manager = employee.role === "manager" || employee.role === "admin";

  async function logout() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error("Sign out failed.");
      router.replace("/login");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/[.08] bg-white px-4 py-6 dark:border-white/[.1] dark:bg-zinc-950 md:flex">
        <Link href="/" className="flex items-center gap-2 px-2 no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
            C
          </span>
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Crewboard</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-6" aria-label="Workspace">
          <NavSection label="Personal" items={PERSONAL_NAV} pathname={pathname} />
          {manager && <NavSection label="Team" items={TEAM_NAV} pathname={pathname} />}
        </nav>
        <div className="mt-auto rounded-lg bg-black/[.03] px-3 py-2 text-xs text-zinc-500 dark:bg-white/[.04] dark:text-zinc-400">
          {employee.organization} · PostgreSQL demo
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[.08] bg-white px-4 py-4 dark:border-white/[.1] dark:bg-zinc-950 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{meta.title}</h1>
            <p className="text-sm text-zinc-500">{meta.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {roleLabel(employee.role)}
            </span>
            <span className="hidden text-sm text-zinc-600 dark:text-zinc-300 sm:inline">{employee.name}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
              {initials(employee.name)}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={busy}
              className="rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-white/[.12] dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
