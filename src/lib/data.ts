import "server-only";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { categories, projects, users } from "@/db/schema";

export type ProjectCard = {
  id: number;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
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

export async function getPublicProjects(
  categorySlug?: string,
): Promise<ProjectCard[]> {
  const where = categorySlug
    ? and(publicCondition, eq(categories.slug, categorySlug))
    : publicCondition;

  return db
    .select(cardColumns)
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(where)
    .orderBy(desc(projects.createdAt)) as Promise<ProjectCard[]>;
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
    .orderBy(desc(projects.createdAt)) as Promise<ProjectCard[]>;
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

export async function getAllProjects(): Promise<ProjectCard[]> {
  return db
    .select(cardColumns)
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .orderBy(desc(projects.createdAt)) as Promise<ProjectCard[]>;
}
