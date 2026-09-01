import "server-only";
import { ZodError } from "zod";
import { appOrigin } from "./auth";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function requireSameOrigin(request: Request) {
  if (request.headers.get("origin") !== appOrigin() || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new HttpError(403, "FORBIDDEN", "This request must come from Crewboard.");
  }
}
export function jsonResponse(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return jsonResponse({ error: error.code, message: error.message }, error.status);
  if (error instanceof ZodError) return jsonResponse({ error: "INVALID_INPUT", message: error.issues.map((issue) => issue.message).join(" ") }, 400);
  if (error instanceof SyntaxError) return jsonResponse({ error: "INVALID_INPUT", message: "Provide valid JSON." }, 400);
  // Do not disclose connection strings, SQL, cookies or raw driver errors.
  console.error("Crewboard request failed", error instanceof Error ? error.name : "UnknownError");
  return jsonResponse({ error: "UNAVAILABLE", message: "The service is unavailable. Please try again." }, 503);
}
