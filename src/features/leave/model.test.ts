import assert from "node:assert/strict";
import test from "node:test";
import { leaveRequestInputSchema } from "./model";

test("accepts valid leave requests and rejects invalid ranges or extra fields", () => {
  const valid = { startDate: "2026-09-02", endDate: "2026-09-06", type: "annual" as const, note: "Family trip" };
  assert.equal(leaveRequestInputSchema.safeParse(valid).success, true);
  assert.equal(leaveRequestInputSchema.safeParse({ ...valid, endDate: "2026-09-02" }).success, true);
  for (const change of [{ endDate: "2026-09-01" }, { startDate: "2026-02-30" }, { type: "holiday" }, { employeeId: "other" }, { note: "x".repeat(501) }]) {
    assert.equal(leaveRequestInputSchema.safeParse({ ...valid, ...change }).success, false, JSON.stringify(change));
  }
});
