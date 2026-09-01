import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Use a valid calendar date.");

export const leaveTypeSchema = z.enum(["annual", "sick", "permission"]);
export const leaveStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const employeeRoleSchema = z.enum(["employee", "manager", "admin"]);
export const approveLeaveInputSchema = z.object({ requestId: z.string().uuid() }).strict();

export const leaveRequestInputSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  type: leaveTypeSchema,
  note: z.string().trim().max(500).optional(),
}).strict().superRefine((value, context) => {
  if (value.endDate < value.startDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the start date." });
  }
});

export type LeaveRequestInput = z.infer<typeof leaveRequestInputSchema>;
export type LeaveRequest = LeaveRequestInput & {
  id: string;
  status: z.infer<typeof leaveStatusSchema>;
  createdAt: string;
  updatedAt: string;
};
export type EmployeeContext = { name: string; organization: string; timezone: string; sessionContext: string; role: z.infer<typeof employeeRoleSchema> };
export type LeaveView = { requests: LeaveRequest[] };
export type TeamLeaveRequest = LeaveRequest & { employeeName: string };
export type TeamLeaveView = { requests: TeamLeaveRequest[] };

export const leaveTypeLabels: Record<LeaveRequestInput["type"], string> = {
  annual: "Annual leave",
  sick: "Sick leave",
  permission: "Permission",
};
