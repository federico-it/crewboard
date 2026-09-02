"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { approveLeaveInputSchema, leaveTypeLabels, type EmployeeContext, type LeaveRequest, type TeamLeaveRequest, type TeamLeaveView } from "@/features/leave/model";

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

export function TeamLeaveWorkspace({ employee, initial }: { employee: EmployeeContext; initial: TeamLeaveView }) {
  const [view, setView] = useState(initial);
  const [approvalDraft, setApprovalDraft] = useState<TeamLeaveRequest | null>(null);
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
      setApprovalDraft(null);
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
      if (!context?.registerTool) { setRegistration("WebMCP unavailable · manual approval still works"); return; }
      try {
        await context.registerTool({
          name: "approve_leave",
          description: "Prepare approval of a team member's pending leave request. Provide requestId from the authorized team list. Does not approve until the manager confirms in the UI.",
          inputSchema: {
            type: "object",
            properties: { requestId: { type: "string", format: "uuid", description: "Leave request ID from the team list." } },
            required: ["requestId"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: async (input) => {
            if (controller.signal.aborted) throw new Error("This team session is no longer active.");
            const args = approveLeaveInputSchema.parse(input);
            const current = await request<TeamLeaveView>("/api/leave/team", employee.sessionContext, { signal: controller.signal });
            const match = current.requests.find((item) => item.id === args.requestId);
            if (!match) throw new Error("Leave request not found in your authorized team list.");
            if (match.status !== "pending") throw new Error("Only pending requests can be approved.");
            setApprovalDraft(match);
            setView(current);
            setError("");
            setMessage("");
            setToolCalls((count) => count + 1);
            const payload = JSON.stringify({ status: "awaiting_confirmation", requestId: match.id, employeeName: match.employeeName, type: match.type, startDate: match.startDate, endDate: match.endDate, message: "Review the approval panel, then confirm or cancel." });
            setToolResult(payload);
            return payload;
          },
        }, { signal: controller.signal });
        if (!controller.signal.aborted) setRegistration("WebMCP tool registered · manager confirmation required");
      } catch {
        if (!controller.signal.aborted) setRegistration("WebMCP registration failed · manual approval still works");
      }
    }
    void register();
    return () => controller.abort();
  }, [employee.sessionContext, reportError]);

  async function refresh() {
    const next = await request<TeamLeaveView>("/api/leave/team", employee.sessionContext, { signal: lifecycle.current?.signal });
    setView(next);
    return next;
  }

  async function approve(requestId: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await request<LeaveRequest>(`/api/leave/${encodeURIComponent(requestId)}/approve`, employee.sessionContext, { method: "POST", body: "{}", signal: lifecycle.current?.signal });
      await refresh();
      setApprovalDraft(null);
      setMessage(`Leave request ${saved.id} approved.`);
      setToolResult(JSON.stringify(saved, null, 2));
    } catch (failure) {
      if (!lifecycle.current?.signal.aborted) reportError(failure);
    } finally { setBusy(false); }
  }

  if (expired) return <main className="attendance-app leave-app workspace-page session-ended"><h1>Session ended</h1><p role="alert">{error || "Your team tools have been disconnected."}</p><Link href="/login">Sign in again</Link></main>;

  return <div className="attendance-app leave-app workspace-page">
    <main className="workspace-main">
      <div className="workspace-heading"><div><p className="eyebrow">{employee.organization} / MANAGER WORKSPACE</p><p className="muted">Review pending requests from your organization. Use the request ID for agent approval.</p></div><span className="demo-badge">Manager demo</span></div>
      {error && <p role="alert" className="error-message">{error}</p>}
      {message && <p role="status" className="success-message">{message}</p>}
      {busy && <p role="status" className="muted">Updating leave request…</p>}
      {approvalDraft && <section className="draft-panel" aria-label="Approval confirmation">
        <p className="eyebrow">AGENT DRAFT</p><h2>Confirm approval</h2>
        <p><strong>{approvalDraft.employeeName}</strong> · {leaveTypeLabels[approvalDraft.type]}</p>
        <p>{formatRange(approvalDraft.startDate, approvalDraft.endDate)}</p>
        <p className="muted">ID {approvalDraft.id}</p>
        <div className="editor-actions"><button disabled={busy} onClick={() => void approve(approvalDraft.id)}>{busy ? "Approving…" : "Confirm approval"}</button><button type="button" className="secondary" disabled={busy} onClick={() => { setApprovalDraft(null); setMessage("Approval cancelled. No change was saved."); }}>Cancel</button></div>
      </section>}
      <section aria-label="Team leave requests">
        <div className="calendar-toolbar"><h2>Authorized team requests</h2><button className="secondary" disabled={busy} onClick={() => void refresh()}>Refresh</button></div>
        {view.requests.length === 0 ? <p className="empty-message">No team leave requests in your organization.</p> : <ul className="request-list">{view.requests.map((item) => <li key={item.id} className={`request-card ${item.status}`}>
          <header><div><strong>{item.employeeName}</strong><p>{leaveTypeLabels[item.type]}</p></div><span className={`status ${item.status}`}>{item.status}</span></header>
          <p>{formatRange(item.startDate, item.endDate)}</p>
          {item.note && <p className="muted">{item.note}</p>}
          <p className="muted">ID <code>{item.id}</code></p>
          {item.status === "pending" && <button className="approve" disabled={busy || approvalDraft !== null} onClick={() => setApprovalDraft(item)}>Review approval</button>}
        </li>)}</ul>}
      </section>
      <section className="agent-panel" aria-labelledby="team-agent-heading">
        <div><p className="eyebrow">MANAGER AGENT FLOW</p><h2 id="team-agent-heading">Ask your browser agent</h2><p>“Approve leave request [ID from the list].”</p><p role="status" className="muted">{registration}</p><p>Successful tool calls: <strong>{toolCalls}</strong></p></div>
        <div><p className="muted">Copy a pending request ID from the list above. `approve_leave` prepares approval; only your confirmation writes to PostgreSQL.</p>{toolResult ? <pre aria-label="WebMCP result">{toolResult}</pre> : <p className="agent-placeholder">Waiting for a WebMCP invocation.</p>}</div>
      </section>
      <footer className="workspace-footer"><span>Team leave · same-organization scope only</span><Link href="/leave">Personal leave</Link><Link href="/">Overview</Link></footer>
    </main>
  </div>;
}
