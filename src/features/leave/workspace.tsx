"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { leaveRequestInputSchema, leaveTypeLabels, type EmployeeContext, type LeaveRequest, type LeaveRequestInput, type LeaveView } from "./model";

class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
async function request<T>(url: string, sessionContext: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", "x-crewboard-session": sessionContext, ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new RequestError(response.status, data.message ?? "The request could not be completed.");
  return data as T;
}

const formatRange = (startDate: string, endDate: string) => startDate === endDate ? startDate : `${startDate} → ${endDate}`;

export function LeaveWorkspace({ employee, initial }: { employee: EmployeeContext; initial: LeaveView }) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [manualDraft, setManualDraft] = useState<LeaveRequestInput>({ startDate: "2026-09-02", endDate: "2026-09-06", type: "annual", note: "" });
  const [agentDraft, setAgentDraft] = useState<LeaveRequestInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [registration, setRegistration] = useState("Checking WebMCP…");
  const [toolResult, setToolResult] = useState("");
  const [toolCalls, setToolCalls] = useState(0);
  const lifecycle = useRef<AbortController | null>(null);

  const reportError = useCallback((failure: unknown) => {
    if (failure instanceof RequestError && (failure.status === 401 || failure.status === 403)) {
      lifecycle.current?.abort();
      setExpired(true);
      setAgentDraft(null);
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
      if (!context?.registerTool) { setRegistration("WebMCP unavailable · manual requests still work"); return; }
      try {
        await context.registerTool({
          name: "get_leave_requests",
          description: "Read the signed-in employee's leave requests. Returns id, type, dates, status and note. Personal data only; no employee ID is accepted.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true },
          execute: async () => {
            if (controller.signal.aborted) throw new Error("This leave session is no longer active.");
            try {
              const next = await request<LeaveView>("/api/leave", employee.sessionContext, { signal: controller.signal });
              if (controller.signal.aborted) throw new Error("This leave session is no longer active.");
              setView(next);
              setToolCalls((count) => count + 1);
              const payload = JSON.stringify(next.requests);
              setToolResult(payload);
              return payload;
            } catch (failure) {
              if (!controller.signal.aborted) reportError(failure);
              throw failure;
            }
          },
        }, { signal: controller.signal });

        await context.registerTool({
          name: "request_leave",
          description: "Prepare a personal leave request for human confirmation. Provide startDate, endDate (YYYY-MM-DD), type (annual, sick, permission) and optional note. Does not submit until the employee confirms in the UI.",
          inputSchema: {
            type: "object",
            properties: {
              startDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
              endDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
              type: { type: "string", enum: ["annual", "sick", "permission"] },
              note: { type: "string", maxLength: 500 },
            },
            required: ["startDate", "endDate", "type"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: async (input) => {
            if (controller.signal.aborted) throw new Error("This leave session is no longer active.");
            const draft = leaveRequestInputSchema.parse(input);
            setAgentDraft(draft);
            setError("");
            setMessage("");
            setToolCalls((count) => count + 1);
            const payload = JSON.stringify({ status: "awaiting_confirmation", ...draft, message: "Review the draft in the confirmation panel, then confirm or cancel." });
            setToolResult(payload);
            return payload;
          },
        }, { signal: controller.signal });

        if (!controller.signal.aborted) setRegistration("WebMCP tools registered · confirmation required for requests");
      } catch {
        if (!controller.signal.aborted) setRegistration("WebMCP registration failed · manual requests still work");
      }
    }
    void register();
    return () => controller.abort();
  }, [employee.sessionContext, reportError]);

  async function submit(draft: LeaveRequestInput) {
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await request<LeaveRequest>("/api/leave", employee.sessionContext, { method: "POST", body: JSON.stringify(draft), signal: lifecycle.current?.signal });
      const next = await request<LeaveView>("/api/leave", employee.sessionContext, { signal: lifecycle.current?.signal });
      setView(next);
      setAgentDraft(null);
      setMessage(`Leave request ${saved.id} saved as ${saved.status}.`);
      setToolResult(JSON.stringify(saved, null, 2));
    } catch (failure) {
      if (!lifecycle.current?.signal.aborted) reportError(failure);
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError("");
    lifecycle.current?.abort();
    setExpired(true); setAgentDraft(null);
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error("Sign out failed. Retry to revoke the session.");
      router.replace("/login");
      router.refresh();
    } catch (failure) { reportError(failure); }
    finally { setBusy(false); }
  }

  if (expired) return <main className="attendance-app leave-app session-ended"><h1>Session ended</h1><p role="alert">{error || "Your leave tools have been disconnected."}</p><Link href="/login">Sign in again</Link><button onClick={logout} disabled={busy}>Retry sign out</button></main>;

  const activeDraft = agentDraft;
  return <div className="attendance-app leave-app">
    <header className="workspace-header">
      <div><Link href="/attendance" className="brand">C / CREWBOARD</Link><nav className="workspace-nav" aria-label="Workspace"><Link href="/attendance">Attendance</Link><Link href="/leave" aria-current="page">Leave</Link></nav></div>
      <div><span>{employee.name}</span><button className="secondary" onClick={logout} disabled={busy}>Sign out</button></div>
    </header>
    <main className="workspace-main">
      <div className="workspace-heading"><div><p className="eyebrow">{employee.organization} / PERSONAL WORKSPACE</p><h1>Leave</h1><p className="muted">Request time off. Your agent can prepare a draft, but only you can submit it.</p></div><span className="demo-badge">Synthetic demo data</span></div>
      {error && <p role="alert" className="error-message">{error}</p>}
      {message && <p role="status" className="success-message">{message}</p>}
      {busy && <p role="status" className="muted">Saving leave request…</p>}
      <div className="leave-columns">
        <section aria-label="Your leave requests">
          <h2>Your requests</h2>
          {view.requests.length === 0 ? <p className="empty-message">No leave requests yet. Use the form or ask your browser agent to prepare one.</p> : <ul className="request-list">{view.requests.map((item) => <li key={item.id} className="request-card"><header><strong>{leaveTypeLabels[item.type]}</strong><span className={`status ${item.status}`}>{item.status}</span></header><p>{formatRange(item.startDate, item.endDate)}</p>{item.note && <p className="muted">{item.note}</p>}<p className="muted">ID {item.id}</p></li>)}</ul>}
        </section>
        <aside>
          {activeDraft ? <section className="draft-panel" aria-label="Agent draft confirmation">
            <p className="eyebrow">AGENT DRAFT</p><h2>Confirm leave request</h2>
            <p><strong>{leaveTypeLabels[activeDraft.type]}</strong></p>
            <p>{formatRange(activeDraft.startDate, activeDraft.endDate)}</p>
            {activeDraft.note && <p className="muted">{activeDraft.note}</p>}
            <p className="muted">Nothing is saved until you confirm.</p>
            <div className="editor-actions"><button disabled={busy} onClick={() => void submit(activeDraft)}>{busy ? "Submitting…" : "Confirm and submit"}</button><button type="button" className="secondary" disabled={busy} onClick={() => { setAgentDraft(null); setMessage("Agent draft cancelled. No request was saved."); }}>Cancel</button></div>
          </section> : <section className="editor-panel" aria-label="Manual leave request">
            <p className="eyebrow">MANUAL REQUEST</p><h2>New request</h2>
            <form onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(manualDraft); }}>
              <label htmlFor="leave-type">Type</label>
              <select id="leave-type" value={manualDraft.type} onChange={(event) => setManualDraft({ ...manualDraft, type: event.target.value as LeaveRequestInput["type"] })} disabled={busy}>
                <option value="annual">Annual leave</option><option value="sick">Sick leave</option><option value="permission">Permission</option>
              </select>
              <label htmlFor="leave-start">Start date</label><input id="leave-start" type="date" required value={manualDraft.startDate} onChange={(event) => setManualDraft({ ...manualDraft, startDate: event.target.value })} disabled={busy} />
              <label htmlFor="leave-end">End date</label><input id="leave-end" type="date" required value={manualDraft.endDate} onChange={(event) => setManualDraft({ ...manualDraft, endDate: event.target.value })} disabled={busy} />
              <label htmlFor="leave-note">Note <span className="muted">(optional)</span></label><textarea id="leave-note" rows={3} maxLength={500} value={manualDraft.note ?? ""} onChange={(event) => setManualDraft({ ...manualDraft, note: event.target.value })} disabled={busy} />
              <div className="editor-actions"><button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit request"}</button></div>
            </form>
          </section>}
        </aside>
      </div>
      <section className="agent-panel" aria-labelledby="leave-agent-heading">
        <div><p className="eyebrow">SAME DATA, TWO WAYS TO WORK</p><h2 id="leave-agent-heading">Ask your browser agent</h2><p>“Request annual leave from 2 to 6 September 2026.”</p><p role="status" className="muted">{registration}</p><p>Successful tool calls: <strong>{toolCalls}</strong></p></div>
        <div><p className="muted">`request_leave` only prepares a draft. `get_leave_requests` reads your saved requests from PostgreSQL.</p>{toolResult ? <pre aria-label="WebMCP result">{toolResult}</pre> : <p className="agent-placeholder">Waiting for a WebMCP invocation.</p>}</div>
      </section>
      <footer className="workspace-footer"><span>Personal leave · PostgreSQL-backed demo</span><Link href="/attendance">Back to attendance</Link></footer>
    </main>
  </div>;
}
