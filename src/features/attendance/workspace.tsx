"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { monthSchema, summaryInputSchema, type AttendanceInput, type AttendanceRecord, type AttendanceSummary, type AttendanceView, type EmployeeContext } from "./model";

class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
async function request<T>(url: string, sessionContext: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", "x-crewboard-session": sessionContext, ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new RequestError(response.status, data.message ?? "The request could not be completed.");
  return data as T;
}
const formatHours = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

export function AttendanceWorkspace({ employee, initial }: { employee: EmployeeContext; initial: AttendanceView }) {
  const [view, setView] = useState(initial);
  const [month, setMonth] = useState(initial.summary.month);
  const [draft, setDraft] = useState<AttendanceInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [registration, setRegistration] = useState("Checking WebMCP…");
  const [toolResult, setToolResult] = useState<AttendanceSummary | null>(null);
  const [toolCalls, setToolCalls] = useState(0);
  const currentMonth = useRef(month);
  const requestVersion = useRef(0);
  const mutationPending = useRef(false);
  const lifecycle = useRef<AbortController | null>(null);

  const reportError = useCallback((failure: unknown) => {
    if (failure instanceof RequestError && (failure.status === 401 || failure.status === 403)) {
      lifecycle.current?.abort();
      setExpired(true); setDraft(null); setToolResult(null);
    }
    setError(failure instanceof Error ? failure.message : "Unable to connect. Please try again.");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    async function register() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      const context = document.modelContext;
      if (!context?.registerTool) { setRegistration("WebMCP unavailable · manual editing still works"); return; }
      try {
        await context.registerTool({
          name: "get_attendance_summary",
          description: "Read the signed-in employee's persisted monthly attendance summary. Returns recorded/completed days, hours excluding breaks and incomplete entries, and incomplete dates. Missing dates are not inferred as absences. No employee ID is accepted. Same-day wall-clock hours in the organization's timezone. Read only.",
          inputSchema: { type: "object", properties: { month: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", description: "Month as YYYY-MM, for example 2026-08." } }, required: ["month"], additionalProperties: false },
          annotations: { readOnlyHint: true },
          execute: async (input) => {
            if (controller.signal.aborted) throw new Error("This attendance session is no longer active.");
            if (mutationPending.current) throw new Error("An attendance save is in progress. Ask again when it finishes.");
            try {
              const args = summaryInputSchema.parse(input);
              const revision = requestVersion.current;
              const next = await request<AttendanceView>(`/api/attendance?month=${encodeURIComponent(args.month)}`, employee.sessionContext, { signal: controller.signal });
              if (controller.signal.aborted) throw new Error("This attendance session is no longer active.");
              if (revision !== requestVersion.current) throw new Error("Attendance changed while the summary was loading. Ask again for the latest data.");
              // An older read must not overwrite a save or a newer month selection.
              if (currentMonth.current === args.month && revision === requestVersion.current) setView(next);
              setToolResult(next.summary); setToolCalls((count) => count + 1);
              return JSON.stringify(next.summary);
            } catch (failure) {
              if (!controller.signal.aborted) reportError(failure);
              throw failure;
            }
          },
        }, { signal: controller.signal });
        if (!controller.signal.aborted) setRegistration("WebMCP tool registered · authenticated, read only");
      } catch { if (!controller.signal.aborted) setRegistration("WebMCP registration failed · manual editing still works"); }
    }
    void register();
    return () => controller.abort();
  }, [employee.sessionContext, reportError]);

  async function loadMonth(target: string) {
    if (!monthSchema.safeParse(target).success) return;
    const revision = ++requestVersion.current;
    setBusy(true); setError(""); setMessage("");
    try {
      const next = await request<AttendanceView>(`/api/attendance?month=${encodeURIComponent(target)}`, employee.sessionContext, { signal: lifecycle.current?.signal });
      if (revision !== requestVersion.current || lifecycle.current?.signal.aborted) return;
      currentMonth.current = target; setMonth(target); setView(next); setDraft(null); setToolResult(null);
    } catch (failure) { if (!lifecycle.current?.signal.aborted) reportError(failure); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || busy) return;
    mutationPending.current = true;
    ++requestVersion.current;
    setBusy(true); setError(""); setMessage("");
    let persisted = false;
    try {
      await request("/api/attendance", employee.sessionContext, { method: "PUT", body: JSON.stringify(draft), signal: lifecycle.current?.signal });
      persisted = true;
      setDraft(null); setToolResult(null);
      const next = await request<AttendanceView>(`/api/attendance?month=${encodeURIComponent(month)}`, employee.sessionContext, { signal: lifecycle.current?.signal });
      if (lifecycle.current?.signal.aborted) return;
      setView(next); setMessage("Attendance saved. The calendar and agent now read the updated database record.");
    } catch (failure) {
      if (!lifecycle.current?.signal.aborted) {
        reportError(failure);
        if (persisted) setMessage("The change was saved, but the calendar could not refresh. Reload the month.");
      }
    } finally { mutationPending.current = false; setBusy(false); }
  }
  function edit(date: string, record?: AttendanceRecord) {
    setError(""); setMessage("");
    setDraft(record ?? { date, start: "09:00", end: null, breakMinutes: 60, version: 0 });
  }

  if (expired) return <main className="attendance-app workspace-page session-ended"><h1>Session ended</h1><p role="alert">{error || "Your attendance tools have been disconnected."}</p><Link href="/login">Sign in again</Link></main>;
  const firstDay = new Date(`${month}-01T12:00:00Z`);
  const dayCount = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = (firstDay.getUTCDay() + 6) % 7;
  const monthLabel = firstDay.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  return <div className="attendance-app workspace-page">
    <main className="workspace-main">
      <div className="workspace-heading"><div><p className="eyebrow">{employee.organization} / PERSONAL WORKSPACE</p><p className="muted">Review your month. Complete the details. Keep your agent in sync.</p></div><span className="demo-badge">Synthetic demo data</span></div>
      <section className="summary-cards" aria-label="Attendance summary">
        <div><p>Worked time</p><strong>{formatHours(view.summary.workedMinutes)}</strong><span>Breaks and incomplete days excluded</span></div>
        <div><p>Completed days</p><strong>{view.summary.completedDays}<small> / {view.summary.recordedDays} recorded</small></strong><span>No absence inferred for unrecorded dates</span></div>
        <div><p>Needs attention</p><strong>{view.summary.incompleteDates.length}<small> incomplete</small></strong><span>{view.summary.incompleteDates.length ? "Add an end time to complete the record" : "All recorded days are complete"}</span></div>
      </section>
      <div className="calendar-toolbar"><h2>{monthLabel}</h2><div><label htmlFor="attendance-month">Month</label><input id="attendance-month" type="month" value={month} onChange={(event) => void loadMonth(event.target.value)} disabled={busy || draft !== null} /><button className="secondary" disabled={busy} onClick={() => void loadMonth(month)}>{draft ? "Discard edits and reload" : "Refresh month"}</button></div></div>
      {error && <p role="alert" className="error-message">{error}</p>}
      {message && <p role="status" className="success-message">{message}</p>}
      {busy && <p role="status" className="muted">Updating attendance…</p>}
      <div className="attendance-columns">
        <section className="calendar-panel" aria-label={`Attendance calendar ${monthLabel}`}>
          <div className="calendar-weekdays" aria-hidden="true">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {Array.from({ length: offset }, (_, index) => <div key={`empty-${index}`} className="calendar-empty" />)}
            {Array.from({ length: dayCount }, (_, index) => {
              const date = `${month}-${String(index + 1).padStart(2, "0")}`;
              const record = view.records.find((row) => row.date === date);
              const status = record ? record.end === null ? "Incomplete" : "Complete" : "No record";
              return <button key={date} className={`calendar-day ${record ? record.end ? "complete" : "incomplete" : "unrecorded"} ${draft?.date === date ? "selected" : ""}`} disabled={busy || (draft !== null && draft.date !== date)} aria-label={`${date}: ${status}`} aria-pressed={draft?.date === date} onClick={() => edit(date, record)}><span>{index + 1}</span><small>{status}</small>{record && <small className="day-time">{record.start}–{record.end ?? "…"}</small>}</button>;
            })}
          </div>
          <p className="calendar-note">Times in {employee.timezone}. One same-day shift per date, using local clock time. Overnight shifts and DST elapsed-time accounting are outside this demo.</p>
          {view.records.length === 0 && <p className="empty-message">No attendance recorded for this month. Select a date to add your first record.</p>}
        </section>
        <aside className="editor-panel" aria-label="Attendance editor">
          {draft ? <form onSubmit={save} key={draft.date}>
            <p className="eyebrow">{draft.version === 0 ? "NEW RECORD" : "EDIT RECORD"}</p><h2>{draft.date}</h2>
            <label htmlFor="shift-start">Start time</label><input id="shift-start" type="time" required value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} disabled={busy} />
            <label htmlFor="shift-end">End time <span className="muted">(optional)</span></label><input id="shift-end" type="time" value={draft.end ?? ""} onChange={(event) => setDraft({ ...draft, end: event.target.value || null })} disabled={busy} />
            <label htmlFor="shift-break">Break in minutes</label><input id="shift-break" type="number" min="0" max="1439" required value={draft.breakMinutes} onChange={(event) => setDraft({ ...draft, breakMinutes: Number(event.target.value) })} disabled={busy} />
            <p className="muted">Without an end time, the day remains incomplete and contributes no worked hours.</p>
            <div className="editor-actions"><button type="submit" disabled={busy}>{busy ? "Saving…" : "Save attendance"}</button><button type="button" className="secondary" disabled={busy} onClick={() => { setDraft(null); setError(""); }}>Cancel</button></div>
          </form> : <><p className="eyebrow">YOUR NEXT STEP</p><h2>{view.summary.incompleteDates.length ? "Finish an incomplete day" : "Your calendar is up to date"}</h2><p className="muted">Select a date to add or correct a record. Changes are saved to your account only.</p>{view.summary.incompleteDates.map((date) => <button key={date} className="attention-link secondary" disabled={busy} onClick={() => edit(date, view.records.find((row) => row.date === date))}>Complete {date} →</button>)}</>}
        </aside>
      </div>
      <section className="agent-panel" aria-labelledby="agent-heading"><div><p className="eyebrow">SAME DATA, TWO WAYS TO WORK</p><h2 id="agent-heading">Ask your browser agent</h2><p>“Get my attendance summary for {monthLabel}.”</p><p role="status" className="muted">{registration}</p><p>Successful tool calls: <strong>{toolCalls}</strong></p></div><div><p className="muted">The tool reads PostgreSQL using your current session. After saving a correction, ask again to verify the updated total.</p>{toolResult ? <pre aria-label="WebMCP result">{JSON.stringify(toolResult, null, 2)}</pre> : <p className="agent-placeholder">Waiting for a WebMCP invocation.</p>}</div></section>
      <footer className="workspace-footer"><span>Personal attendance · PostgreSQL-backed demo</span><Link href="/spike">Original technical spike</Link><Link href="/">Overview</Link></footer>
    </main>
  </div>;
}
