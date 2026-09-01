import { approveLeaveRequest } from "@/server/leave";
import { requireEmployee } from "@/server/attendance";
import { errorResponse, jsonResponse, requireSameOrigin } from "@/server/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const actor = await requireEmployee(request.headers, true);
    const { id } = await context.params;
    return jsonResponse(await approveLeaveRequest(actor, { requestId: id }));
  } catch (error) { return errorResponse(error); }
}
