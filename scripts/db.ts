import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { and, eq } from "drizzle-orm";
import { createDatabase } from "../src/server/db/connection";
import { user, account, organizations, employees, attendanceRecords, leaveRequests } from "../src/server/db/schema";
import { attendance } from "../src/lib/attendance";

async function main() {
const command = process.argv[2];
if (!["migrate", "seed"].includes(command)) throw new Error("Use migrate or seed.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const { db, pool } = createDatabase(process.env.DATABASE_URL);
try {
  if (command === "migrate") {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations applied.");
  } else {
    if (process.env.DEMO_SEED_ENABLED !== "true") throw new Error("Set DEMO_SEED_ENABLED=true only for a synthetic demo database.");
    const password = process.env.DEMO_PASSWORD;
    if (!password || password.length < 12 || password.startsWith("REPLACE_")) throw new Error("Set DEMO_PASSWORD (at least 12 characters).");
    const passwordHash = await hashPassword(password);
    await db.transaction(async (tx) => {
      for (const org of [{ id: "demo-crewboard", name: "Crewboard Demo" }, { id: "demo-other-org", name: "Other Demo Organization" }]) {
        const [existing] = await tx.select().from(organizations).where(eq(organizations.id, org.id));
        if (existing && !existing.isDemo) throw new Error("Refusing to seed a non-demo organization.");
        await tx.insert(organizations).values({ ...org, timezone: "Europe/Rome", isDemo: true }).onConflictDoNothing();
      }
      const fixtures = [
        { id: "demo-alex", email: "alex@crewboard.example", name: "Alex Morgan", organizationId: "demo-crewboard" },
        { id: "demo-sam", email: "sam@crewboard.example", name: "Sam Taylor", organizationId: "demo-crewboard" },
        { id: "demo-robin", email: "robin@crewboard.example", name: "Robin Lee", organizationId: "demo-other-org" },
      ];
      for (const fixture of fixtures) {
        // Idempotent bootstrap: never overwrite passwords, sessions or edited attendance.
        await tx.insert(user).values({ id: fixture.id, email: fixture.email, name: fixture.name, emailVerified: true }).onConflictDoNothing();
        const [existingUser] = await tx.select().from(user).where(eq(user.id, fixture.id));
        if (existingUser?.email !== fixture.email) throw new Error("Demo identity collides with existing data.");
        await tx.insert(account).values({ id: `${fixture.id}-credential`, accountId: fixture.id, userId: fixture.id, providerId: "credential", issuer: "local:credential", password: passwordHash }).onConflictDoNothing();
        await tx.insert(employees).values({ id: `${fixture.id}-employee`, userId: fixture.id, organizationId: fixture.organizationId }).onConflictDoNothing();
        const [employee] = await tx.select().from(employees).where(and(eq(employees.userId, fixture.id), eq(employees.organizationId, fixture.organizationId)));
        if (!employee) throw new Error("Demo employee collides with another organization.");
        const records = fixture.id === "demo-alex" ? attendance : [{ date: "2026-08-26", start: "10:00", end: "12:00", breakMinutes: 0 }];
        for (const row of records) await tx.insert(attendanceRecords).values({ id: randomUUID(), employeeId: employee.id, ...row })
          .onConflictDoNothing({ target: [attendanceRecords.employeeId, attendanceRecords.date] });
        if (fixture.id === "demo-alex") {
          await tx.insert(leaveRequests).values({
            id: "demo-alex-leave-pending",
            employeeId: employee.id,
            type: "permission",
            startDate: "2026-09-12",
            endDate: "2026-09-12",
            status: "pending",
            note: "Demo pending request for manager approval tests.",
          }).onConflictDoNothing();
        }
      }
    });
    console.log("Demo accounts ready: alex@crewboard.example, sam@crewboard.example, robin@crewboard.example. Existing data preserved.");
  }
} finally { await pool.end(); }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Database command failed."); process.exitCode = 1; });
