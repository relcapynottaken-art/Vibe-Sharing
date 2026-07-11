import "server-only";
import { and, asc, count, desc, eq, ilike, ne, not, or } from "drizzle-orm";
import { db } from "@/db";
import { categories, feedback, projects, users } from "@/db/schema";

export type ProjectCard = {
  id: number;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  projectType: "website" | "claude_artifact";
  pricing: "free" | "paid";
  isPinned: boolean;
  isPublic: boolean;
  submissionStatus: "none" | "pending" | "approved" | "rejected";
  reviewerNote: string | null;
  createdAt: Date;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  authorId: number;
  authorName: string;
  authorRole: "admin" | "user";
};

const cardColumns = {
  id: projects.id,
  title: projects.title,
  description: projects.description,
  url: projects.url,
  imageUrl: projects.imageUrl,
  projectType: projects.projectType,
  pricing: projects.pricing,
  isPinned: projects.isPinned,
  isPublic: projects.isPublic,
  submissionStatus: projects.submissionStatus,
  reviewerNote: projects.reviewerNote,
  createdAt: projects.createdAt,
  categoryId: projects.categoryId,
  categoryName: categories.name,
  categorySlug: categories.slug,
  authorId: users.id,
  authorName: users.username,
  authorRole: users.role,
};

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

// A project is visible to the public when the admin marked their own project
// public, OR when a user submission has been approved by the admin.
const publicCondition = or(
  and(eq(users.role, "admin"), eq(projects.isPublic, true)),
  eq(projects.submissionStatus, "approved"),
);

export type ProjectSort = "newest" | "oldest" | "name";

export async function getPublicProjects(
  categorySlug?: string,
  opts?: { q?: string; sort?: ProjectSort },
): Promise<ProjectCard[]> {
  const conditions = [publicCondition];
  if (categorySlug) conditions.push(eq(categories.slug, categorySlug));
  if (opts?.q) {
    const term = `%${opts.q}%`;
    conditions.push(
      or(ilike(projects.title, term), ilike(projects.description, term))!,
    );
  }

  const orderBy =
    opts?.sort === "oldest"
      ? asc(projects.createdAt)
      : opts?.sort === "name"
        ? asc(projects.title)
        : desc(projects.createdAt);

  return db
    .select(cardColumns)
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(orderBy) as Promise<ProjectCard[]>;
}

// Approved community (non-admin) submissions only.
export async function getCommunityProjects(): Promise<ProjectCard[]> {
  return db
    .select(cardColumns)
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(
      and(eq(users.role, "user"), eq(projects.submissionStatus, "approved")),
    )
    .orderBy(desc(projects.createdAt)) as Promise<ProjectCard[]>;
}

export async function getProjectById(
  id: number,
): Promise<ProjectCard | undefined> {
  const rows = (await db
    .select(cardColumns)
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(eq(projects.id, id))
    .limit(1)) as ProjectCard[];
  return rows[0];
}

export async function getUserProjects(userId: number): Promise<ProjectCard[]> {
  return db
    .select(cardColumns)
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(projects.isPinned), desc(projects.createdAt)) as Promise<
    ProjectCard[]
  >;
}

export async function getPendingSubmissions(): Promise<ProjectCard[]> {
  return db
    .select(cardColumns)
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(eq(projects.submissionStatus, "pending"))
    .orderBy(desc(projects.createdAt)) as Promise<ProjectCard[]>;
}

// Everything not visible to the public and not already in the review queue:
// admin's own hidden projects, plus user projects kept private or rejected.
// Admin-only — never exposed to non-admin callers.
export async function getPrivateProjects(): Promise<ProjectCard[]> {
  return db
    .select(cardColumns)
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(
      and(not(publicCondition!), ne(projects.submissionStatus, "pending")),
    )
    .orderBy(desc(projects.createdAt)) as Promise<ProjectCard[]>;
}

export async function getAllProjects(): Promise<ProjectCard[]> {
  return db
    .select(cardColumns)
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .orderBy(desc(projects.createdAt)) as Promise<ProjectCard[]>;
}

export type UserProfile = {
  id: number;
  username: string;
  role: "admin" | "user";
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  isTrusted: boolean;
  createdAt: Date;
};

export async function getUserPublicProfile(
  username: string,
  opts?: { viewerIsAdmin?: boolean },
): Promise<{ profile: UserProfile; projects: ProjectCard[] } | undefined> {
  const [profile] = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      websiteUrl: users.websiteUrl,
      isTrusted: users.isTrusted,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!profile) return undefined;

  // Admins see every project the user owns, public or private. Everyone else
  // still only sees what publicCondition allows through.
  const where = opts?.viewerIsAdmin
    ? eq(projects.ownerId, profile.id)
    : and(eq(projects.ownerId, profile.id), publicCondition);

  const ownerProjects = (await db
    .select(cardColumns)
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(where)
    .orderBy(desc(projects.isPinned), desc(projects.createdAt))) as ProjectCard[];

  return { profile, projects: ownerProjects };
}

// ---------- Feedback & tiers ----------

export type FeedbackItem = {
  id: number;
  projectId: number;
  body: string;
  createdAt: Date;
  authorId: number;
  authorName: string;
};

export async function getProjectFeedback(
  projectId: number,
): Promise<FeedbackItem[]> {
  return db
    .select({
      id: feedback.id,
      projectId: feedback.projectId,
      body: feedback.body,
      createdAt: feedback.createdAt,
      authorId: feedback.authorId,
      authorName: users.username,
    })
    .from(feedback)
    .innerJoin(users, eq(feedback.authorId, users.id))
    .where(eq(feedback.projectId, projectId))
    .orderBy(desc(feedback.createdAt));
}

export type Tier = "newcomer" | "bronze" | "silver" | "gold";

export const TIER_LABELS: Record<Tier, string> = {
  newcomer: "Newcomer",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

// Tier derives from activity only: publicly visible uploads plus feedback
// received on them. Trusted status is separate — an explicit admin decision.
export function computeTier(uploads: number, feedbackReceived: number): Tier {
  const score = uploads * 10 + feedbackReceived * 2;
  if (score >= 100) return "gold";
  if (score >= 40) return "silver";
  if (score >= 10) return "bronze";
  return "newcomer";
}

export async function getUserTier(
  userId: number,
): Promise<{ tier: Tier; uploads: number; feedbackReceived: number }> {
  const [uploadRow] = await db
    .select({ value: count() })
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .where(and(eq(projects.ownerId, userId), publicCondition));

  const [feedbackRow] = await db
    .select({ value: count() })
    .from(feedback)
    .innerJoin(projects, eq(feedback.projectId, projects.id))
    .where(eq(projects.ownerId, userId));

  const uploads = uploadRow?.value ?? 0;
  const feedbackReceived = feedbackRow?.value ?? 0;
  return { tier: computeTier(uploads, feedbackReceived), uploads, feedbackReceived };
}
