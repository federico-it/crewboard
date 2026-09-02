export type AgentCapability = {
  tool: string;
  prompt: string;
  description: string;
  role: "employee" | "manager";
  status: "live" | "planned";
  page?: { href: string; label: string };
  requiresConfirmation?: boolean;
};

export const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    tool: "overview",
    prompt: "Do I need to do anything before I finish work today?",
    description:
      "Guide question: the agent checks incomplete attendance, pending leave requests, and unread payslips, then suggests possible actions.",
    role: "employee",
    status: "planned",
    page: { href: "/", label: "Overview" },
  },
  {
    tool: "get_attendance_summary",
    prompt: "Get my attendance summary for August 2026.",
    description: "Worked hours, completed days, and incomplete dates for the month.",
    role: "employee",
    status: "live",
    page: { href: "/attendance", label: "Attendance" },
  },
  {
    tool: "get_my_attendance",
    prompt: "Show my attendance entries for August 2026.",
    description: "Daily detail for start time, end time, break, and status.",
    role: "employee",
    status: "planned",
    page: { href: "/attendance", label: "Attendance" },
  },
  {
    tool: "get_working_colleagues",
    prompt: "Who from my team is working today?",
    description: "Colleagues in office, remote, or on leave for the given date.",
    role: "employee",
    status: "planned",
  },
  {
    tool: "get_leave_requests",
    prompt: "What are my leave requests?",
    description: "List of your requests with type, dates, status, and notes.",
    role: "employee",
    status: "live",
    page: { href: "/leave", label: "Leave" },
  },
  {
    tool: "request_leave",
    prompt: "Request annual leave from 2 to 6 September 2026.",
    description: "Prepares a leave or permission draft; confirmation stays in the UI.",
    role: "employee",
    status: "live",
    page: { href: "/leave", label: "Leave" },
    requiresConfirmation: true,
  },
  {
    tool: "get_my_payslips",
    prompt: "List my payslips.",
    description: "List of payslips available in your personal archive.",
    role: "employee",
    status: "planned",
  },
  {
    tool: "get_payslip",
    prompt: "Open my July 2026 payslip.",
    description: "Retrieve a single payslip for the given month.",
    role: "employee",
    status: "planned",
  },
  {
    tool: "approve_leave",
    prompt: "Approve leave request [ID from the list].",
    description: "Prepares approval of a pending team request; manager confirmation required.",
    role: "manager",
    status: "live",
    page: { href: "/team/leave", label: "Team leave" },
    requiresConfirmation: true,
  },
];

export const AGENT_NOTES = [
  "Same session and permissions as the dashboard: the agent reads only your data.",
  "Actions that change data (leave, approvals) always require human confirmation in the UI.",
  "Attendance corrections remain manual in the interface; there is no dedicated WebMCP tool yet.",
];
