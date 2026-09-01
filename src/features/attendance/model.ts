import { z } from "zod";

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM.");
export const summaryInputSchema = z.object({ month: monthSchema }).strict();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Use a valid calendar date.");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM.");
export function timeMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export const attendanceInputSchema = z.object({
  date: dateSchema,
  start: timeSchema,
  end: timeSchema.nullable(),
  breakMinutes: z.number().int().min(0).max(1439),
  version: z.number().int().min(0).max(2147483646),
}).strict().superRefine((value, context) => {
  if (value.end !== null && timeMinutes(value.end) <= timeMinutes(value.start)) {
    context.addIssue({ code: "custom", path: ["end"], message: "End must be after start; overnight shifts are not supported." });
  }
  if (value.end !== null && value.breakMinutes >= timeMinutes(value.end) - timeMinutes(value.start)) {
    context.addIssue({ code: "custom", path: ["breakMinutes"], message: "Break must be shorter than the shift." });
  }
});

export type AttendanceInput = z.infer<typeof attendanceInputSchema>;
export type AttendanceRecord = AttendanceInput;
export type EmployeeContext = { name: string; organization: string; timezone: string; sessionContext: string };

export function summarizeAttendance(month: string, rows: AttendanceRecord[], timezone: string) {
  const records = rows.filter((row) => row.date.startsWith(`${month}-`));
  const incompleteDates = records.filter((row) => row.end === null).map((row) => row.date);
  const workedMinutes = records.reduce((total, row) => total + (row.end === null ? 0 : timeMinutes(row.end) - timeMinutes(row.start) - row.breakMinutes), 0);
  return {
    month, timezone, source: "database" as const,
    coverage: "Recorded days only. Unrecorded dates are not inferred as absences. Same-day wall-clock hours; incomplete entries are excluded.",
    recordedDays: records.length,
    completedDays: records.length - incompleteDates.length,
    workedMinutes, workedHours: workedMinutes / 60, incompleteDates,
  };
}
export type AttendanceSummary = ReturnType<typeof summarizeAttendance>;
export type AttendanceView = { records: AttendanceRecord[]; summary: AttendanceSummary };
