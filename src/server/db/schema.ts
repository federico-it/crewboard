import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, date, time, index, uniqueIndex, check } from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

// Better Auth core schema. Business authorization belongs to employees below.
export const user = pgTable("auth_user", {
  id: text("id").primaryKey(), name: text("name").notNull(),
  email: text("email").notNull().unique(), emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"), createdAt: createdAt(), updatedAt: updatedAt(),
});
export const session = pgTable("auth_session", {
  id: text("id").primaryKey(), token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(), updatedAt: updatedAt(), ipAddress: text("ip_address"), userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("session_user_idx").on(table.userId)]);
export const account = pgTable("auth_account", {
  id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  issuer: text("issuer").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"), password: text("password"), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [index("account_user_idx").on(table.userId), uniqueIndex("account_issuer_idx").on(table.issuer, table.accountId)]);
export const verification = pgTable("auth_verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(), name: text("name").notNull(), timezone: text("timezone").notNull().default("Europe/Rome"),
  isDemo: boolean("is_demo").notNull().default(false),
});
export const employees = pgTable("employees", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  role: text("role").notNull().default("employee"),
  active: boolean("active").notNull().default(true),
}, (table) => [
  index("employee_organization_idx").on(table.organizationId),
  check("employee_role_valid", sql`${table.role} IN ('employee', 'manager', 'admin')`),
]);
export const attendanceRecords = pgTable("attendance", {
  id: text("id").primaryKey(), employeeId: text("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(), start: time("start_time").notNull(), end: time("end_time"),
  breakMinutes: integer("break_minutes").notNull().default(0), version: integer("version").notNull().default(1),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("attendance_employee_date_idx").on(table.employeeId, table.date),
  check("attendance_break_bounds", sql`${table.breakMinutes} >= 0 AND ${table.breakMinutes} < 1440`),
  check("attendance_version_positive", sql`${table.version} > 0`),
  check("attendance_shift_valid", sql`${table.end} IS NULL OR (${table.end} > ${table.start} AND EXTRACT(EPOCH FROM (${table.end} - ${table.start})) / 60 > ${table.breakMinutes})`),
]);

export const leaveRequests = pgTable("leave_requests", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  approvedBy: text("approved_by").references(() => employees.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("leave_date_order", sql`${table.endDate} >= ${table.startDate}`),
  check("leave_status_valid", sql`${table.status} IN ('pending', 'approved', 'rejected')`),
  check("leave_type_valid", sql`${table.type} IN ('annual', 'sick', 'permission')`),
  index("leave_employee_idx").on(table.employeeId),
]);
