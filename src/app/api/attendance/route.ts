import { requireEmployee, readAttendance, saveAttendance } from "@/server/attendance";
import { errorResponse, HttpError, jsonResponse, requireSameOrigin } from "@/server/http";

export async function GET(request: Request) {
  try {
    const actor = await requireEmployee(request.headers, true);
    const params = new URL(request.url).searchParams;
    if ([...params.keys()].some((key) => key !== "month") || params.getAll("month").length !== 1) {
      throw new HttpError(400, "INVALID_INPUT", "Provide only one month parameter.");
    }
    return jsonResponse(await readAttendance(actor, { month: params.get("month") }));
  } catch (error) { return errorResponse(error); }
}
export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await requireEmployee(request.headers, true);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new HttpError(415, "INVALID_INPUT", "JSON is required.");
    const body = await request.text();
    if (body.length > 2048) throw new HttpError(413, "INVALID_INPUT", "Request too large.");
    let input: unknown;
    try { input = JSON.parse(body); }
    catch { throw new HttpError(400, "INVALID_INPUT", "Provide valid JSON."); }
    return jsonResponse(await saveAttendance(actor, input));
  } catch (error) { return errorResponse(error); }
}
