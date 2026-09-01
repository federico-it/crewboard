import { getAuth } from "@/server/auth";
import { errorResponse, jsonResponse, requireSameOrigin } from "@/server/http";

// Do not expose account creation/modification or password-reset endpoints for shared demo accounts.
async function handle(request: Request) {
  const action = new URL(request.url).pathname.replace("/api/auth/", "");
  const allowed = request.method === "GET" ? ["get-session"] : ["sign-in/email", "sign-out"];
  if (!allowed.includes(action)) return jsonResponse({ error: "NOT_FOUND" }, 404);
  try {
    if (request.method === "POST") requireSameOrigin(request);
    const response = await getAuth().handler(request);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) { return errorResponse(error); }
}
export const GET = handle;
export const POST = handle;
