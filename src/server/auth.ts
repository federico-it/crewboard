import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDatabase } from "./db/connection";
import * as schema from "./db/schema";

export function appOrigin() {
  const value = process.env.BETTER_AUTH_URL;
  if (!value) throw new Error("BETTER_AUTH_URL is required.");
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password || !["http:", "https:"].includes(url.protocol)) {
    throw new Error("BETTER_AUTH_URL must be an HTTP(S) origin without a path.");
  }
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("Remote authentication requires HTTPS.");
  return url.origin;
}
function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("REPLACE_")) throw new Error("Set a random BETTER_AUTH_SECRET of at least 32 characters.");
  return betterAuth({
    appName: "Crewboard", baseURL: appOrigin(), secret,
    database: drizzleAdapter(getDatabase().db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
    session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 60, cookieCache: { enabled: false } },
    // Only login, session lookup and logout are exposed by our route handler.
    rateLimit: { enabled: true, window: 60, max: 30 },
  });
}
let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return auth ??= createAuth(); }
