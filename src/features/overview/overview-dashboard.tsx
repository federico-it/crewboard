import Link from "next/link";
import type { ReactNode } from "react";
import type { AttendanceSummary } from "@/features/attendance/model";
import type { LeaveRequest } from "@/features/leave/model";
import { leaveTypeLabels } from "@/features/leave/model";
import { AGENT_CAPABILITIES, AGENT_NOTES } from "@/features/workspace/agent-capabilities";
import type { WorkspaceEmployee } from "@/features/workspace/types";

const TEAM_TODAY = [
  { name: "Federico", status: "Remote", tone: "ok" as const },
  { name: "Andrea", status: "Office", tone: "ok" as const },
  { name: "Marco", status: "Leave", tone: "leave" as const },
  { name: "Giulia", status: "Office", tone: "ok" as const },
];

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-black/[.08] bg-white p-5 shadow-sm dark:border-white/[.1] dark:bg-zinc-900 ${className}`}
    >
      {children}
    </div>
  );
}

function formatHours(minutes: number) {
  return `${Math.floor(minutes / 60)} h`;
}

function greetingName(name: string) {
  return name.split(/\s+/)[0] ?? name;
}

function buildTodos(summary: AttendanceSummary, requests: LeaveRequest[]) {
  const todos: { tone: "amber" | "sky" | "emerald"; text: string; href?: string }[] = [];

  for (const date of summary.incompleteDates.slice(0, 2)) {
    todos.push({
      tone: "amber",
      text: `Manca l'orario di uscita del ${date}.`,
      href: "/attendance",
    });
  }

  const pending = requests.filter((item) => item.status === "pending");
  if (pending.length > 0) {
    todos.push({
      tone: "sky",
      text: `${pending.length} richiesta/e ferie in attesa di approvazione.`,
      href: "/leave",
    });
  }

  if (todos.length === 0) {
    todos.push({
      tone: "emerald",
      text: "Nessuna azione urgente sulle presenze o sulle ferie.",
      href: "/attendance",
    });
  }

  todos.push({
    tone: "emerald",
    text: "Buste paga: funzione prevista, non ancora attiva.",
  });

  return todos;
}

export function OverviewDashboard({
  employee,
  summary,
  requests,
}: {
  employee: WorkspaceEmployee;
  summary: AttendanceSummary;
  requests: LeaveRequest[];
}) {
  const monthLabel = new Date(`${summary.month}-01T12:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const pendingCount = requests.filter((item) => item.status === "pending").length;
  const todos = buildTodos(summary, requests);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Good morning, {greetingName(employee.name)}</h2>
        <p className="mt-1 text-sm text-zinc-500">Do I need to do anything before I finish work today?</p>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-zinc-500">Ore lavorate</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{formatHours(summary.workedMinutes)}</p>
          <p className="mt-1 text-xs text-zinc-400">{monthLabel}</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Presenze</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {summary.completedDays} / {summary.recordedDays}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Giorni compilati</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Ferie</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{pendingCount} pending</p>
          <p className="mt-1 text-xs text-zinc-400">
            <Link href="/leave" className="underline underline-offset-2">
              Vedi richieste
            </Link>
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Buste paga</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">—</p>
          <p className="mt-1 text-xs text-zinc-400">In arrivo</p>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Da completare</h3>
            <span className="text-xs text-zinc-400">{todos.length} elementi</span>
          </div>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {todos.map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    item.tone === "amber" ? "bg-amber-500" : item.tone === "sky" ? "bg-sky-500" : "bg-emerald-500"
                  }`}
                />
                {item.href ? (
                  <Link href={item.href} className="underline underline-offset-2">
                    {item.text}
                  </Link>
                ) : (
                  <span>{item.text}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Your team today</h3>
            <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-500">Previsto</span>
          </div>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {TEAM_TODAY.map((member) => (
              <li key={member.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      member.tone === "leave" ? "bg-amber-400" : "bg-emerald-500"
                    }`}
                  />
                  {member.name}
                </span>
                <span className="text-zinc-500">{member.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {requests.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Ultime richieste ferie</h3>
            <Link href="/leave" className="text-xs text-zinc-500 underline underline-offset-2">
              Tutte →
            </Link>
          </div>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {requests.slice(0, 3).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{leaveTypeLabels[item.type]}</strong> · {item.startDate}
                  {item.endDate !== item.startDate ? ` → ${item.endDate}` : ""}
                </span>
                <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs capitalize text-zinc-600">{item.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Cosa puoi chiedere all&apos;agente</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Esempi in linguaggio naturale per il browser agent (WebMCP). Apri la pagina collegata per
              registrare i tool attivi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-400">
              {AGENT_CAPABILITIES.filter((item) => item.status === "live").length} attivi
            </span>
            <span className="rounded-full bg-zinc-500/10 px-2.5 py-1 font-medium text-zinc-600 dark:text-zinc-300">
              {AGENT_CAPABILITIES.filter((item) => item.status === "planned").length} in arrivo
            </span>
          </div>
        </div>

        <ul className="mt-5 flex flex-col gap-3">
          {AGENT_CAPABILITIES.map((item) => (
            <li
              key={item.tool}
              className="rounded-lg border border-black/[.06] bg-zinc-50/80 p-4 dark:border-white/[.08] dark:bg-white/[.03]"
            >
              <div className="flex flex-wrap items-center gap-2">
                {item.tool !== "overview" ? (
                  <code className="rounded-md bg-black/[.05] px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-white/[.08] dark:text-zinc-300">
                    {item.tool}
                  </code>
                ) : (
                  <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-400">
                    Domanda guida
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    item.status === "live"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {item.status === "live" ? "Attivo" : "Previsto"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    item.role === "manager"
                      ? "bg-violet-500/10 text-violet-700 dark:text-violet-400"
                      : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {item.role === "manager" ? "Manager" : "Dipendente"}
                </span>
                {item.requiresConfirmation && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    Conferma UI
                  </span>
                )}
                {item.page && (
                  <Link
                    href={item.page.href}
                    className="ml-auto text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                  >
                    {item.page.label} →
                  </Link>
                )}
              </div>
              <p className="mt-3 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                &ldquo;{item.prompt}&rdquo;
              </p>
              <p className="mt-1.5 text-sm text-zinc-500">{item.description}</p>
            </li>
          ))}
        </ul>

        <ul className="mt-5 flex flex-col gap-2 border-t border-black/[.06] pt-4 text-xs text-zinc-500 dark:border-white/[.08] dark:text-zinc-400">
          {AGENT_NOTES.map((note) => (
            <li key={note} className="flex gap-2">
              <span aria-hidden="true">·</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
