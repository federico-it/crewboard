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
      "Domanda guida: l'agente controlla presenze incomplete, richieste ferie in sospeso e buste paga da leggere, poi propone le azioni possibili.",
    role: "employee",
    status: "planned",
    page: { href: "/", label: "Overview" },
  },
  {
    tool: "get_attendance_summary",
    prompt: "Get my attendance summary for August 2026.",
    description: "Ore lavorate, giorni compilati e date incomplete del mese.",
    role: "employee",
    status: "live",
    page: { href: "/attendance", label: "Attendance" },
  },
  {
    tool: "get_my_attendance",
    prompt: "Show my attendance entries for August 2026.",
    description: "Dettaglio giornaliero di entrata, uscita, pausa e stato.",
    role: "employee",
    status: "planned",
    page: { href: "/attendance", label: "Attendance" },
  },
  {
    tool: "get_working_colleagues",
    prompt: "Who from my team is working today?",
    description: "Colleghi in ufficio, remote o in ferie nella data indicata.",
    role: "employee",
    status: "planned",
  },
  {
    tool: "get_leave_requests",
    prompt: "What are my leave requests?",
    description: "Elenco delle tue richieste con tipo, date, stato e note.",
    role: "employee",
    status: "live",
    page: { href: "/leave", label: "Leave" },
  },
  {
    tool: "request_leave",
    prompt: "Request annual leave from 2 to 6 September 2026.",
    description: "Prepara una bozza di ferie o permesso; la conferma resta nell'interfaccia.",
    role: "employee",
    status: "live",
    page: { href: "/leave", label: "Leave" },
    requiresConfirmation: true,
  },
  {
    tool: "get_my_payslips",
    prompt: "List my payslips.",
    description: "Elenco delle buste paga disponibili nel tuo archivio personale.",
    role: "employee",
    status: "planned",
  },
  {
    tool: "get_payslip",
    prompt: "Open my July 2026 payslip.",
    description: "Recupera una singola busta paga del mese indicato.",
    role: "employee",
    status: "planned",
  },
  {
    tool: "approve_leave",
    prompt: "Approve leave request [ID from the list].",
    description: "Prepara l'approvazione di una richiesta pending del team; serve conferma manager.",
    role: "manager",
    status: "live",
    page: { href: "/team/leave", label: "Team leave" },
    requiresConfirmation: true,
  },
];

export const AGENT_NOTES = [
  "Stessa sessione e stessi permessi della dashboard: l'agente legge solo i tuoi dati.",
  "Le azioni che modificano dati (ferie, approvazioni) richiedono sempre conferma umana nell'UI.",
  "La correzione delle presenze resta manuale nell'interfaccia; non c'è ancora un tool WebMCP dedicato.",
];
