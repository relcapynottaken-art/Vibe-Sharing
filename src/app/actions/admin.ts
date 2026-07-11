"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, projects, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");
  return user;
}

export type ReviewState = { error?: string };

export async function reviewSubmissionAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  await ensureAdmin();

  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision"));
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 2000);
  if (!Number.isInteger(id)) return { error: "Invalid project." };
  if (decision !== "approved" && decision !== "rejected") {
    return { error: "Invalid decision." };
  }

  // Only projects actually awaiting review can be decided — prevents a
  // forged form from flipping arbitrary rows straight to "approved".
  const updated = await db
    .update(projects)
    .set({
      submissionStatus: decision,
      reviewerNote: note || null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(projects.id, id), eq(projects.submissionStatus, "pending")),
    )
    .returning({ id: projects.id });
  if (updated.length === 0) {
    return { error: "That project is not awaiting review." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export type TrustState = { error?: string };

// Trusted status is an independent admin decision — it is never derived from
// tier, uploads, or feedback.
export async function toggleTrustedAction(
  _prev: TrustState,
  formData: FormData,
): Promise<TrustState> {
  await ensureAdmin();

  const id = Number(formData.get("userId"));
  if (!Number.isInteger(id)) return { error: "Invalid user." };

  const [target] = await db
    .select({ id: users.id, username: users.username, isTrusted: users.isTrusted })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!target) return { error: "User not found." };

  await db
    .update(users)
    .set({ isTrusted: !target.isTrusted, updatedAt: new Date() })
    .where(eq(users.id, id));

  revalidatePath(`/u/${target.username}`);
  return {};
}

export type CategoryState = { error?: string };

export async function createCategoryAction(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Category name is too short." };
  if (name.length > 60) return { error: "Category name is too long." };
  const slug = slugify(name);
  if (!slug) return { error: "Invalid category name." };

  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (existing.length > 0) return { error: "That category already exists." };

  await db.insert(categories).values({ name, slug });
  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export async function deleteCategoryAction(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  await ensureAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Invalid category." };
  // projects.categoryId is ON DELETE SET NULL, so projects survive uncategorized.
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}
