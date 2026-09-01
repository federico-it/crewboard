import assert from "node:assert/strict";
import test from "node:test";
import { Pool } from "pg";

test("authenticated attendance persists, isolates employees, rejects stale writes and revokes sessions", async () => {
  const http = process.env.ATTENDANCE_HTTP_TEST === "true";
  const base = http ? process.env.TEST_BASE_URL : process.env.BETTER_AUTH_URL;
  const databaseURL = process.env.DATABASE_URL;
  const password = process.env.DEMO_PASSWORD;
  assert.ok(base && databaseURL && password, "Set BETTER_AUTH_URL, DATABASE_URL and DEMO_PASSWORD; HTTP mode also uses TEST_BASE_URL.");
  assert.equal(process.env.DEMO_SEED_ENABLED, "true", "Integration tests require the synthetic demo database.");
  for (const url of [base, databaseURL]) assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname), "Never run these tests against a remote service.");
  const pool = new Pool({ connectionString: databaseURL });
  const routes = http ? null : {
    auth: await import("../src/app/api/auth/[...all]/route"),
    attendance: await import("../src/app/api/attendance/route"),
  };
  // In-process mode invokes real route handlers, without starting a listening server.
  async function send(url: string, options: RequestInit = {}) {
    if (!routes) return fetch(url, options);
    const request = new Request(url, options);
    if (new URL(url).pathname.startsWith("/api/auth/")) return request.method === "POST" ? routes.auth.POST(request) : routes.auth.GET(request);
    return request.method === "PUT" ? routes.attendance.PUT(request) : routes.attendance.GET(request);
  }
  type Login = { cookie: string; context: string };
  const logins: Login[] = [];
  async function login(email: string) {
    const response = await send(`${base}/api/auth/sign-in/email`, { method: "POST", headers: { Origin: base!, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    assert.equal(response.status, 200, `Sign in failed for ${email}`);
    const cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    const current = await send(`${base}/api/auth/get-session`, { headers: { Cookie: cookie } });
    const session = await current.json();
    assert.ok(session.session?.id);
    const result = { cookie, context: session.session.id as string };
    logins.push(result);
    return result;
  }
  function call(login: Login, path = "/api/attendance?month=2026-08", options: RequestInit = {}) {
    return send(base + path, { ...options, headers: { Cookie: login.cookie, Origin: base!, "x-crewboard-session": login.context, "Content-Type": "application/json", ...options.headers } });
  }
  let restore: { start_time: string; end_time: string | null; break_minutes: number } | undefined;
  let verifiedDemo = false;
  try {
    const marker = await pool.query("select is_demo from organizations where id = 'demo-crewboard'");
    assert.equal(marker.rows[0]?.is_demo, true);
    verifiedDemo = true;
    assert.equal((await send(`${base}/api/attendance?month=2026-08`)).status, 401);
    const alex = await login("alex@crewboard.example");
    const sam = await login("sam@crewboard.example");
    const robin = await login("robin@crewboard.example");
    const original = await call(alex);
    assert.match(original.headers.get("cache-control") ?? "", /no-store/);
    const initial = await original.json();
    assert.equal(initial.summary.source, "database");
    assert.equal(initial.records.length, 4);
    const day = initial.records.find((row: { date: string }) => row.date === "2026-08-26");
    assert.ok(day);
    restore = { start_time: day.start, end_time: day.end, break_minutes: day.breakMinutes };
    const change = { ...day, end: "18:00" };
    assert.equal((await call(alex, "/api/attendance", { method: "PUT", body: JSON.stringify(change), headers: { Origin: "https://untrusted.example" } })).status, 403);
    assert.equal((await call(alex, "/api/attendance?month=2026-08&userId=demo-sam")).status, 400);
    assert.equal((await call(alex, "/api/attendance?month=2026-08&month=2026-09")).status, 400);
    assert.equal((await call(alex, "/api/attendance?month=2026-13")).status, 400);
    assert.equal((await call(alex, "/api/attendance", { method: "PUT", body: JSON.stringify({ ...change, employeeId: "demo-sam-employee" }) })).status, 400);
    assert.equal((await call(alex, "/api/attendance", { method: "PUT", body: "{" })).status, 400);
    assert.equal((await call(alex, "/api/attendance", { method: "PUT", body: JSON.stringify({ ...change, end: "08:00" }) })).status, 400);
    const save = await call(alex, "/api/attendance", { method: "PUT", body: JSON.stringify(change) });
    assert.equal(save.status, 200);
    assert.equal((await call(alex, "/api/attendance", { method: "PUT", body: JSON.stringify(change) })).status, 409);
    const updated = await (await call(alex)).json();
    assert.equal(updated.summary.workedMinutes, 1890);
    assert.equal(updated.summary.completedDays, 4);
    assert.deepEqual(updated.summary.incompleteDates, []);
    const saved = await pool.query("select end_time from attendance where employee_id = 'demo-alex-employee' and date = '2026-08-26'");
    assert.equal(saved.rows[0].end_time, "18:00:00");
    for (const other of [sam, robin]) {
      const result = await (await call(other)).json();
      assert.equal(result.summary.workedMinutes, 120);
      assert.equal(result.records.length, 1);
    }
    // An old page context cannot operate under a new user's cookie.
    assert.equal((await call({ cookie: sam.cookie, context: alex.context })).status, 401);
    const empty = await (await call(alex, "/api/attendance?month=2026-09")).json();
    assert.equal(empty.records.length, 0);
    await pool.query("update employees set active = false where id = 'demo-robin-employee'");
    assert.equal((await call(robin)).status, 403);
    await pool.query("update auth_session set expires_at = now() - interval '1 minute' where id = $1", [sam.context]);
    assert.equal((await call(sam)).status, 401);
    assert.equal((await call(alex, "/api/auth/sign-up/email", { method: "POST", body: "{}" })).status, 404);
    assert.equal((await call(alex, "/api/auth/change-password", { method: "POST", body: "{}" })).status, 404);
    assert.equal((await call(alex, "/api/auth/sign-out", { method: "POST", body: "{}" })).status, 200);
    assert.equal((await call(alex)).status, 401);
    assert.equal((await call(alex, "/api/attendance", { method: "PUT", body: JSON.stringify(change) })).status, 401);
  } finally {
    if (restore) await pool.query("update attendance set start_time = $1, end_time = $2, break_minutes = $3, version = version + 1 where employee_id = 'demo-alex-employee' and date = '2026-08-26'", [restore.start_time, restore.end_time, restore.break_minutes]);
    if (verifiedDemo) await pool.query("update employees set active = true where id = 'demo-robin-employee'");
    for (const login of logins) await pool.query("delete from auth_session where id = $1", [login.context]);
    await pool.end();
    if (!http) await (await import("../src/server/db/connection")).getDatabase().pool.end();
  }
});
