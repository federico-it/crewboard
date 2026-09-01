import assert from "node:assert/strict";
import test from "node:test";
import { attendanceInputSchema, summaryInputSchema, summarizeAttendance } from "./model";
import { attendance } from "../../lib/attendance";

test("the completed August 26 correction changes 23.5 hours to 31.5 hours", () => {
  const rows = attendance.map((row) => ({ ...row, version: 1 }));
  const original = summarizeAttendance("2026-08", rows, "Europe/Rome");
  assert.equal(original.workedMinutes, 1410);
  assert.deepEqual(original.incompleteDates, ["2026-08-26"]);
  const corrected = rows.map((row) => row.date === "2026-08-26" ? { ...row, end: "18:00" } : row);
  assert.equal(summarizeAttendance("2026-08", corrected, "Europe/Rome").workedMinutes, 1890);
  assert.equal(summarizeAttendance("2026-08", corrected, "Europe/Rome").completedDays, 4);
  assert.equal(summarizeAttendance("2026-09", rows, "Europe/Rome").recordedDays, 0);
});
test("rejects employee selection, impossible dates, overnight shifts, and invalid breaks", () => {
  const valid = { date: "2026-08-26", start: "09:00", end: "18:00", breakMinutes: 60, version: 1 };
  for (const change of [{ date: "2026-02-30" }, { start: "25:00" }, { end: "08:00" }, { end: "09:00" }, { breakMinutes: -1 }, { breakMinutes: 540 }, { breakMinutes: 1.5 }, { employeeId: "someone-else" }, { version: -1 }]) {
    assert.equal(attendanceInputSchema.safeParse({ ...valid, ...change }).success, false, JSON.stringify(change));
  }
  assert.equal(attendanceInputSchema.safeParse({ ...valid, date: "2024-02-29" }).success, true);
  assert.equal(attendanceInputSchema.safeParse({ ...valid, end: null }).success, true);
  assert.equal(summaryInputSchema.safeParse({ month: "2026-08", userId: "other" }).success, false);
});
