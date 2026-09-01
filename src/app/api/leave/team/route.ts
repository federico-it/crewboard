import { readTeamLeaveRequests } from "@/server/leave";
import { requireEmployee } from "@/server/attendance";
import { errorResponse, jsonResponse } from "@/server/http";

export async function GET(request: Request) {
  try {
    const actor = await requireEmployee(request.headers, true);
    return jsonResponse(await readTeamLeaveRequests(actor));
  } catch (error) { return errorResponse(error); }
}
