"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { attendance, DEMO_MONTH, getAttendanceSummary } from "@/lib/attendance";

type Registration = "checking" | "unsupported" | "registered" | "error";

export function AttendanceSpike() {
  const [registration, setRegistration] = useState<Registration>("checking");
  const [registrationError, setRegistrationError] = useState("");
  const [browserInfo, setBrowserInfo] = useState("Checking browser…");
  const [month, setMonth] = useState(DEMO_MONTH);
  const [manualResult, setManualResult] = useState("");
  const [toolResult, setToolResult] = useState("");
  const [toolCalls, setToolCalls] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // Defer setup so Strict Mode's discarded effect never registers a tool.
    async function register() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setBrowserInfo(navigator.userAgent);
      const context = document.modelContext;
      if (!context || typeof context.registerTool !== "function") {
        setRegistration("unsupported");
        return;
      }
      try {
        await context.registerTool({
          name: "get_attendance_summary",
          description: "Read a fictional attendance summary for a month. Returns completed days, worked minutes/hours excluding incomplete entries, and incomplete dates. Partial demo fixture: August 2026 only. Other months return no records. No authentication or real employee data.",
          inputSchema: {
            type: "object",
            properties: {
              month: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", description: "Month in YYYY-MM format; demo data is in 2026-08." },
            },
            required: ["month"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: async (input) => {
            if (controller.signal.aborted) throw new Error("Attendance page is no longer active.");
            try {
              const result = getAttendanceSummary(input);
              setToolCalls((count) => count + 1);
              setToolResult(JSON.stringify(result, null, 2));
              return JSON.stringify(result);
            } catch (error) {
              setToolResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            }
          },
        }, { signal: controller.signal });
        if (!controller.signal.aborted) setRegistration("registered");
      } catch (error) {
        if (!controller.signal.aborted) {
          setRegistration("error");
          setRegistrationError(error instanceof Error ? error.message : String(error));
        }
      }
    }
    void register();
    return () => controller.abort();
  }, []);

  const statusText: Record<Registration, string> = {
    checking: "Checking WebMCP…",
    unsupported: "WebMCP unavailable in this browser",
    registered: "WebMCP tool registered",
    error: "WebMCP registration failed",
  };

  return <main>
    <header>
      <p className="eyebrow">Crewboard / technical spike 01</p>
      <h1>One page. One tool.</h1>
      <p className="intro">A read-only attendance summary, shared by the interface and a browser agent.</p>
      <p className="notice">Fictional data only · No authentication · No database · No persistence</p>
    </header>

    <section aria-labelledby="integration-title">
      <h2 id="integration-title">Browser integration</h2>
      <p role="status" className={`status ${registration}`}>{statusText[registration]}</p>
      {registration === "unsupported" && <p>Use ChatGPT’s WebMCP-enabled browser or Chrome 149+ with <code>chrome://flags/#enable-webmcp-testing</code> enabled, then restart the browser. The manual summary below still works.</p>}
      {registrationError && <p role="alert">{registrationError}</p>}
      <p>Ask your browser agent: <strong>“Get my attendance summary for August 2026.”</strong></p>
      <p>Tool: <code>get_attendance_summary</code> · Input: <code>{'{"month":"2026-08"}'}</code></p>
      <details><summary>Browser diagnostics</summary><p className="diagnostics">{browserInfo}</p><p>Registration success alone does not prove agent discovery or execution.</p></details>
    </section>

    <section aria-labelledby="fixture-title">
      <h2 id="fixture-title">The fixture</h2>
      <p>Four sample days, not a full month. Missing dates are not inferred as absences. Incomplete entries do not contribute worked hours.</p>
      <div className="table-scroll"><table>
        <caption>Fictional attendance · August 2026 · same-day shifts</caption>
        <thead><tr><th scope="col">Date</th><th scope="col">Start</th><th scope="col">End</th><th scope="col">Break</th></tr></thead>
        <tbody>{attendance.map((row) => <tr key={row.date}><th scope="row">{row.date}</th><td>{row.start}</td><td>{row.end ?? "Incomplete"}</td><td>{row.breakMinutes} min</td></tr>)}</tbody>
      </table></div>
      <p><strong>Expected:</strong> 3 complete days · 1,410 minutes / 23.5 hours · incomplete: August 26.</p>
    </section>

    <div className="results">
      <section aria-labelledby="manual-title">
        <h2 id="manual-title">Manual check</h2>
        <form onSubmit={(event) => {
          event.preventDefault();
          try { setManualResult(JSON.stringify(getAttendanceSummary({ month }), null, 2)); }
          catch (error) { setManualResult(`Error: ${error instanceof Error ? error.message : String(error)}`); }
        }}>
          <label htmlFor="month">Month (YYYY-MM)</label>
          <div className="form-row"><input id="month" value={month} onChange={(event) => setMonth(event.target.value)} required pattern="[0-9]{4}-(0[1-9]|1[0-2])" placeholder="2026-08" /><button type="submit">Calculate manually</button></div>
        </form>
        <p>This calls the shared function directly, not WebMCP.</p>
        <pre aria-live="polite">{manualResult || "No manual calculation yet."}</pre>
      </section>

      <section aria-labelledby="agent-title">
        <h2 id="agent-title">WebMCP execution</h2>
        <p aria-live="polite">Successful tool calls: <strong>{toolCalls}</strong></p>
        <p>This panel updates only when the registered tool executes. Counts reset on reload.</p>
        <pre aria-live="polite">{toolResult || "Waiting for a real WebMCP invocation."}</pre>
      </section>
    </div>

    <footer><Link href="/about">Check navigation cleanup →</Link><p>Leaving this page should remove the tool; coming back should register it once.</p></footer>
  </main>;
}
