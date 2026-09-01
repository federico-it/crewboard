import { createLeaveRequest, readLeaveRequests } from "@/server/leave";
import { requireEmployee } from "@/server/attendance";
import { errorResponse, HttpError, jsonResponse, requireSameOrigin } from "@/server/http";

export async function GET(request: Request) {
  try {
    const actor = await requireEmployee(request.headers, true);
    return jsonResponse(await readLeaveRequests(actor));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await requireEmployee(request.headers, true);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new HttpError(415, "INVALID_INPUT", "JSON is required.");
    const body = await request.text();
    if (body.length > 2048) throw new HttpError(413, "INVALID_INPUT", "Request too large.");
    let input: unknown;
    try { input = JSON.parse(body); }
    catch { throw new HttpError(400, "INVALID_INPUT", "Provide valid JSON."); }
    return jsonResponse(await createLeaveRequest(actor, input), 201);
  } catch (error) { return errorResponse(error); }
}
