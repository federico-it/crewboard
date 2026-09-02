import Link from "next/link";
import type { ReactNode } from "react";
import type { AttendanceSummary } from "@/features/attendance/model";
import type { LeaveRequest } from "@/features/leave/model";
import { leaveTypeLabels } from "@/features/leave/model";
import { AGENT_CAPABILITIES, AGENT_NOTES, type AgentCapability } from "@/features/workspace/agent-capabilities";
import type { WorkspaceEmployee } from "@/features/workspace/types";

const TEAM_TODAY = [
  { name: "Federico Rossi", status: "Remote", tone: "ok" as const },
  { name: "Andrea Bianchi", status: "Office", tone: "ok" as const },
  { name: "Marco Conti", status: "On leave", tone: "leave" as const },
  { name: "Giulia Ferri", status: "Office", tone: "ok" as const },
];

type Tone = "amber" | "sky" | "emerald" | "violet" | "rose" | "zinc";

const PILL_TONES: Record<Tone, string> = {
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  zinc: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
};

const DOT_TONES: Record<Tone, string> = {
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  zinc: "bg-zinc-400",
};

const STATUS_TONES: Record<LeaveRequest["status"], Tone> = {
  pending: "amber",
  approved: "emerald",
  rejected: "rose",
};

const FOCUS_BASE = "focus-visible:outline-2 focus-visible:outline-offset-2";
const FOCUS_RING = `${FOCUS_BASE} focus-visible:outline-zinc-900 dark:focus-visible:outline-white`;
// For controls sitting on the inverted "today" panel.
const FOCUS_RING_INVERTED = `${FOCUS_BASE} focus-visible:outline-white dark:focus-visible:outline-zinc-900`;

function Card({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  return (
    <Tag
      className={`rounded-2xl border border-black/[.08] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] dark:border-white/[.1] dark:bg-zinc-900 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 ${PILL_TONES[tone]}`}>
      {children}
    </span>
  );
}

function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[.14em] text-zinc-500 dark:text-zinc-400 ${className}`}>
      {children}
    </p>
  );
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="text-sm font-semibold tracking-tight">
      {children}
    </h3>
  );
}

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 rounded text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white ${FOCUS_RING}`}
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${String(rest).padStart(2, "0")}m`;
}

function formatDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function formatRange(start: string, end: string) {
  if (start === end) return formatDay(start);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const startLabel = sameMonth
    ? new Date(`${start}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" })
    : formatDay(start);
  return `${startLabel} – ${formatDay(end)}`;
}

function greeting(name: string, timezone: string) {
  const first = name.split(/\s+/)[0] ?? name;
  let hour = 9;
  try {
    hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: timezone }).format(new Date()));
  } catch {
    // Unknown timezone in the organization record: fall back to a morning greeting.
  }
  const word = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${word}, ${first}`;
}

function todayLabel(timezone: string) {
  try {
    return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: timezone });
  } catch {
    return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type Action = { tone: Tone; title: string; detail: string; href: string; cta: string };

function buildActions(summary: AttendanceSummary, requests: LeaveRequest[]): Action[] {
  const actions: Action[] = [];

  for (const date of summary.incompleteDates.slice(0, 3)) {
    actions.push({
      tone: "amber",
      title: `Missing end time for ${formatDay(date)}`,
      detail: "The day counts no hours until it is completed.",
      href: "/attendance",
      cta: "Complete day",
    });
  }
  if (summary.incompleteDates.length > 3) {
    actions.push({
      tone: "amber",
      title: `${summary.incompleteDates.length - 3} more incomplete days`,
      detail: "Review the full month in the attendance calendar.",
      href: "/attendance",
      cta: "Open calendar",
    });
  }

  const pending = requests.filter((item) => item.status === "pending");
  if (pending.length > 0) {
    actions.push({
      tone: "sky",
      title: pending.length === 1 ? "1 leave request awaiting approval" : `${pending.length} leave requests awaiting approval`,
      detail: "Nothing to do on your side; you will see the decision here.",
      href: "/leave",
      cta: "View requests",
    });
  }

  return actions;
}

function StatCard({
  label,
  value,
  meta,
  children,
  muted = false,
}: {
  label: string;
  value: ReactNode;
  meta: ReactNode;
  children?: ReactNode;
  muted?: boolean;
}) {
  return (
    <Card className={muted ? "border-dashed bg-transparent shadow-none dark:bg-transparent" : ""}>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p
        className={`mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums ${
          muted ? "text-zinc-300 dark:text-zinc-600" : ""
        }`}
      >
        {value}
      </p>
      {children}
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{meta}</p>
    </Card>
  );
}

function CapabilityCard({ item }: { item: AgentCapability }) {
  const live = item.status === "live";
  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border p-4 ${
        live
          ? "border-black/[.08] bg-white dark:border-white/[.1] dark:bg-zinc-900"
          : "border-dashed border-black/[.1] bg-transparent dark:border-white/[.12]"
      }`}
    >
      <p className={`text-sm font-medium leading-snug ${live ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-300"}`}>
        &ldquo;{item.prompt}&rdquo;
      </p>
      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{item.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        {item.tool === "overview" ? (
          <Pill tone="sky">Guide question</Pill>
        ) : (
          <code className="rounded-md bg-black/[.05] px-1.5 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-white/[.08] dark:text-zinc-300">
            {item.tool}
          </code>
        )}
        {item.role === "manager" && <Pill tone="violet">Manager</Pill>}
        {item.requiresConfirmation && <Pill tone="amber">Confirm in UI</Pill>}
        {item.page && (
          <span className="ml-auto">
            <TextLink href={item.page.href}>{item.page.label}</TextLink>
          </span>
        )}
      </div>
    </li>
  );
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
  const approvedCount = requests.filter((item) => item.status === "approved").length;
  const actions = buildActions(summary, requests);
  const attentionCount = actions.filter((item) => item.tone === "amber").length;
  const completion = summary.recordedDays === 0 ? 0 : Math.round((summary.completedDays / summary.recordedDays) * 100);
  const liveCapabilities = AGENT_CAPABILITIES.filter((item) => item.status === "live");
  const plannedCapabilities = AGENT_CAPABILITIES.filter((item) => item.status === "planned");
  const recentRequests = [...requests]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 4);

  const headline =
    attentionCount === 0
      ? actions.length === 0
        ? "You're clear for today."
        : "Nothing to fix. One thing to keep an eye on."
      : attentionCount === 1
        ? "One thing needs you before you log off."
        : `${attentionCount} things need you before you log off.`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{greeting(employee.name, summary.timezone)}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {todayLabel(summary.timezone)} · {employee.organization}
          </p>
        </div>
        <Pill tone="zinc">Synthetic demo data</Pill>
      </header>

      <section
        aria-labelledby="today-heading"
        className="overflow-hidden rounded-2xl bg-zinc-900 text-white shadow-[0_1px_2px_rgba(0,0,0,.08),0_12px_32px_-16px_rgba(0,0,0,.4)] dark:bg-white dark:text-zinc-900"
      >
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="lg:max-w-sm">
            <Eyebrow className="text-zinc-400 dark:text-zinc-500">Before you log off</Eyebrow>
            <h3 id="today-heading" className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {headline}
            </h3>
            <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
              The same answer your browser agent gives to &ldquo;Do I need to do anything before I finish work today?&rdquo;
            </p>
          </div>

          <ul className="flex flex-1 flex-col divide-y divide-white/10 dark:divide-black/10 lg:max-w-xl">
            {actions.length === 0 ? (
              <li className="flex items-center gap-3 py-3">
                <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${DOT_TONES.emerald}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">All recorded days are complete and no request is waiting.</p>
                  <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Come back tomorrow, or ask the agent to double-check.</p>
                </div>
                <Link
                  href="/attendance"
                  className={`shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/10 dark:border-black/15 dark:hover:bg-black/5 ${FOCUS_RING_INVERTED}`}
                >
                  Open attendance
                </Link>
              </li>
            ) : (
              actions.map((item) => (
                <li key={item.title} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0">
                  <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${DOT_TONES[item.tone]}`} />
                  <div className="min-w-[14rem] flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{item.detail}</p>
                  </div>
                  <Link
                    href={item.href}
                    className={`shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-700 ${FOCUS_RING_INVERTED}`}
                  >
                    {item.cta}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section aria-label={`Summary for ${monthLabel}`} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Hours worked" value={formatHours(summary.workedMinutes)} meta={monthLabel} />
        <StatCard
          label="Days completed"
          value={
            <>
              {summary.completedDays}
              <span className="text-base font-normal text-zinc-400 dark:text-zinc-500"> / {summary.recordedDays}</span>
            </>
          }
          meta={
            summary.incompleteDates.length === 0
              ? "All recorded days complete"
              : `${summary.incompleteDates.length} incomplete`
          }
        >
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completion}
            aria-label="Share of recorded days completed"
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.08]"
          >
            <div
              className={`h-full rounded-full ${completion === 100 ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${completion}%` }}
            />
          </div>
        </StatCard>
        <StatCard
          label="Leave"
          value={
            <>
              {pendingCount}
              <span className="text-base font-normal text-zinc-400 dark:text-zinc-500"> pending</span>
            </>
          }
          meta={<TextLink href="/leave">{approvedCount} approved</TextLink>}
        />
        <StatCard label="Payslips" value="—" meta="Coming soon" muted />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
        <Card as="section" aria-labelledby="requests-heading" className="lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle id="requests-heading">Recent leave requests</SectionTitle>
            <TextLink href="/leave">View all</TextLink>
          </div>
          {recentRequests.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-black/[.1] p-6 text-center dark:border-white/[.12]">
              <p className="text-sm font-medium">No leave requests yet</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Use the form on the Leave page, or ask the agent to prepare a draft for you.
              </p>
              <Link
                href="/leave"
                className={`mt-4 inline-flex rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 ${FOCUS_RING}`}
              >
                Request leave
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-black/[.06] dark:divide-white/[.08]">
              {recentRequests.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 rounded-full ${DOT_TONES[STATUS_TONES[item.status]]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{leaveTypeLabels[item.type]}</p>
                    {item.note && <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.note}</p>}
                  </div>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
                    {formatRange(item.startDate, item.endDate)}
                  </span>
                  <Pill tone={STATUS_TONES[item.status]}>
                    <span className="capitalize">{item.status}</span>
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" aria-labelledby="team-heading" className="border-dashed bg-transparent shadow-none dark:bg-transparent">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle id="team-heading">Your team today</SectionTitle>
            <Pill tone="zinc">Preview</Pill>
          </div>
          <ul className="mt-3 flex flex-col">
            {TEAM_TODAY.map((member) => (
              <li key={member.name} className="flex items-center gap-3 py-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[.06] text-[11px] font-medium text-zinc-700 dark:bg-white/[.1] dark:text-zinc-200">
                  {initials(member.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{member.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${member.tone === "leave" ? DOT_TONES.amber : DOT_TONES.emerald}`} />
                  {member.status}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Sample data. Powered by <code className="font-mono text-[11px]">get_working_colleagues</code> once it ships.
          </p>
        </Card>
      </div>

      <section aria-labelledby="agent-heading" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Same data, two ways to work</Eyebrow>
            <h3 id="agent-heading" className="mt-1 text-lg font-semibold tracking-tight">
              What you can ask the agent
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              Natural-language examples for the browser agent (WebMCP). Tools register when you open the linked page,
              with your session and permissions.
            </p>
          </div>
          <div className="flex gap-2">
            <Pill tone="emerald">{liveCapabilities.length} live</Pill>
            <Pill tone="zinc">{plannedCapabilities.length} planned</Pill>
          </div>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT_TONES.emerald}`} />
            Live now
          </p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {liveCapabilities.map((item) => (
              <CapabilityCard key={item.tool} item={item} />
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT_TONES.zinc}`} />
            Planned
          </p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {plannedCapabilities.map((item) => (
              <CapabilityCard key={item.tool} item={item} />
            ))}
          </ul>
        </div>

        <ul className="flex flex-col gap-1.5 border-t border-black/[.06] pt-4 text-xs text-zinc-500 dark:border-white/[.08] dark:text-zinc-400">
          {AGENT_NOTES.map((note) => (
            <li key={note} className="flex gap-2">
              <span aria-hidden="true">·</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
