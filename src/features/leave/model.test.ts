import assert from "node:assert/strict";
import test from "node:test";
import { leaveRequestInputSchema, approveLeaveInputSchema } from "./model";

test("accepts valid leave requests and rejects invalid ranges or extra fields", () => {
  const valid = { startDate: "2026-09-02", endDate: "2026-09-06", type: "annual" as const, note: "Family trip" };
  assert.equal(leaveRequestInputSchema.safeParse(valid).success, true);
  assert.equal(leaveRequestInputSchema.safeParse({ ...valid, endDate: "2026-09-02" }).success, true);
  for (const change of [{ endDate: "2026-09-01" }, { startDate: "2026-02-30" }, { type: "holiday" }, { employeeId: "other" }, { note: "x".repeat(501) }]) {
    assert.equal(leaveRequestInputSchema.safeParse({ ...valid, ...change }).success, false, JSON.stringify(change));
  }
});

test("accepts leave approval ids and rejects extra fields", () => {
  assert.equal(approveLeaveInputSchema.safeParse({ requestId: "a7251f19-4d0e-45bc-94d7-77684ecf8fcd" }).success, true);
  assert.equal(approveLeaveInputSchema.safeParse({ requestId: "not-a-uuid" }).success, false);
  assert.equal(approveLeaveInputSchema.safeParse({ requestId: "a7251f19-4d0e-45bc-94d7-77684ecf8fcd", employeeId: "other" }).success, false);
});
