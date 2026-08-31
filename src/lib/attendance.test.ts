import assert from "node:assert/strict";
import test from "node:test";
import { getAttendanceSummary } from "./attendance";

test("deducts breaks and excludes incomplete days from hours", () => {
  const result = getAttendanceSummary({ month: "2026-08" });
  assert.equal(result.workedMinutes, 1410);
  assert.equal(result.workedHours, 23.5);
  assert.equal(result.recordedDays, 4);
  assert.equal(result.completedDays, 3);
  assert.deepEqual(result.incompleteDates, ["2026-08-26"]);
});

test("a month outside the fixture has no records, not inferred absences", () => {
  const result = getAttendanceSummary({ month: "2026-09" });
  assert.equal(result.recordedDays, 0);
  assert.equal(result.workedMinutes, 0);
  assert.deepEqual(result.incompleteDates, []);
});

test("rejects malformed input and arbitrary employee selection", () => {
  for (const input of [null, [], {}, { month: 202608 }, { month: "2026-13" },
    { month: "2026-8" }, { month: "2026-08", userId: "someone-else" }]) {
    assert.throws(() => getAttendanceSummary(input), /YYYY-MM/);
  }
});
