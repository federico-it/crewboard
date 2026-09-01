import type { ReactNode } from "react";
import Link from "next/link";

const NAV_SECTIONS: { label: string; items: { name: string; active?: boolean }[] }[] = [
  {
    label: "Personale",
    items: [
      { name: "Overview", active: true },
      { name: "Attendance" },
      { name: "Leave" },
      { name: "Payslips" },
      { name: "Profile" },
    ],
  },
  {
    label: "Team",
    items: [{ name: "Team" }, { name: "Leave requests" }, { name: "Team attendance" }],
  },
];

const SUMMARY_CARDS = [
  { label: "Ore lavorate", value: "152 h", hint: "Agosto 2026" },
  { label: "Presenze", value: "18 / 20", hint: "Giorni compilati" },
  { label: "Ferie residue", value: "4 g", hint: "Da pianificare" },
  { label: "Buste paga", value: "1 nuova", hint: "Luglio disponibile" },
];

const TEAM_TODAY = [
  { name: "Federico", status: "Remote", tone: "ok" as const },
  { name: "Andrea", status: "Office", tone: "ok" as const },
  { name: "Marco", status: "Leave", tone: "leave" as const },
  { name: "Giulia", status: "Office", tone: "ok" as const },
];

const WEBMCP_TOOLS = [
  "get_my_attendance",
  "get_attendance_summary",
  "get_working_colleagues",
  "get_my_payslips",
  "request_leave",
  "get_leave_requests",
  "approve_leave",
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

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/[.08] bg-white px-4 py-6 dark:border-white/[.1] dark:bg-zinc-950 md:flex">
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
            C
          </span>
          <span className="text-base font-semibold tracking-tight">Crewboard</span>
        </div>
        <nav className="mt-8 flex flex-col gap-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
                {section.label}
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <span
                      className={`block rounded-lg px-2 py-1.5 text-sm ${
                        item.active
                          ? "bg-zinc-900 font-medium text-white dark:bg-white dark:text-zinc-900"
                          : "text-zinc-600 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.06]"
                      }`}
                    >
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-auto rounded-lg bg-black/[.03] px-3 py-2 text-xs text-zinc-500 dark:bg-white/[.04] dark:text-zinc-400">
          Mockup statico · nessuna autenticazione o funzione HR attiva
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/[.08] bg-white px-6 py-4 dark:border-white/[.1] dark:bg-zinc-950">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
            <p className="text-sm text-zinc-500">Your workplace, agent-ready.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/spike" className="text-sm underline">WebMCP spike</Link>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              EMPLOYEE
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
              A
            </span>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Good morning, Andrea</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Do I need to do anything before I finish work today?
            </p>
          </div>

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {SUMMARY_CARDS.map((card) => (
              <Card key={card.label}>
                <p className="text-sm text-zinc-500">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{card.value}</p>
                <p className="mt-1 text-xs text-zinc-400">{card.hint}</p>
              </Card>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Da completare</h3>
                <span className="text-xs text-zinc-400">3 elementi</span>
              </div>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Manca l&apos;orario di uscita di martedì.
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  Richiesta ferie di marzo ancora in bozza.
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Nuova busta paga di luglio disponibile.
                </li>
              </ul>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold">Your team today</h3>
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

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">WebMCP tools previsti</h3>
              <span className="text-xs text-zinc-400">stessa sessione, stessi permessi</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {WEBMCP_TOOLS.map((tool) => (
                <code
                  key={tool}
                  className="rounded-md bg-black/[.05] px-2 py-1 font-mono text-xs text-zinc-700 dark:bg-white/[.08] dark:text-zinc-200"
                >
                  {tool}
                </code>
              ))}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
