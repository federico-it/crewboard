export const DEMO_MONTH = "2026-08";

// A partial, fictional fixture, not a complete working calendar or employee record.
export const attendance = [
  { date: "2026-08-24", start: "09:00", end: "18:00", breakMinutes: 60 },
  { date: "2026-08-25", start: "09:00", end: "17:30", breakMinutes: 30 },
  { date: "2026-08-26", start: "09:00", end: null, breakMinutes: 60 },
  { date: "2026-08-27", start: "09:30", end: "18:00", breakMinutes: 60 },
] as const;

export function getAttendanceSummary(input: unknown) {
  if (
    !input || typeof input !== "object" || Array.isArray(input) ||
    Object.keys(input).some((key) => key !== "month") ||
    !("month" in input) || typeof input.month !== "string" ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)
  ) {
    throw new Error("Provide only month in YYYY-MM format (for example 2026-08).");
  }

  const month = input.month;
  const records = attendance.filter((row) => row.date.startsWith(month));
  const incompleteDates: string[] = [];
  let workedMinutes = 0;
  const minutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };
  for (const row of records) {
    if (row.end === null) incompleteDates.push(row.date);
    else workedMinutes += minutes(row.end) - minutes(row.start) - row.breakMinutes;
  }

  return {
    month,
    source: "hardcoded-demo",
    coverage: "Partial fixture only; absent dates are not inferred as missing attendance.",
    recordedDays: records.length,
    completedDays: records.length - incompleteDates.length,
    workedMinutes,
    workedHours: workedMinutes / 60,
    incompleteDates,
  };
}
