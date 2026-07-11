import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "user"]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "none",
  "pending",
  "approved",
  "rejected",
]);
export const projectTypeEnum = pgEnum("project_type", [
  "website",
  "claude_artifact",
]);
export const pricingEnum = pgEnum("pricing", ["free", "paid"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("user"),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  websiteUrl: text("website_url"),
  // Independent admin decision — never derived from tier/uploads/feedback.
  isTrusted: boolean("is_trusted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Backs revocable sessions: the JWT cookie proves who signed it and that it
// hasn't expired, but not that it's still "logged in" — logout deletes the
// matching row here, and getCurrentUser() checks it on every request so a
// copied/leaked token stops working.
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sid: text("sid").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Fixed-window rate limiting shared across serverless instances.
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  projectType: projectTypeEnum("project_type").notNull().default("website"),
  pricing: pricingEnum("pricing").notNull().default("free"),
  // Owner-controlled: pinned projects sort first on their profile.
  isPinned: boolean("is_pinned").notNull().default(false),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  // For admin-owned projects this is the "show to others" switch.
  isPublic: boolean("is_public").notNull().default(false),
  // For user-submitted projects: pending -> approved/rejected by admin review.
  submissionStatus: submissionStatusEnum("submission_status")
    .notNull()
    .default("none"),
  reviewerNote: text("reviewer_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Short feedback left by signed-in users on publicly visible projects.
// Feeds the owner's tier alongside their upload count.
export const feedback = pgTable(
  "feedback",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("feedback_project_author").on(t.projectId, t.authorId)],
);

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
