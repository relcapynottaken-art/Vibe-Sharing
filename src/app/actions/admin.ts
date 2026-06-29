"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, projects } from "@/db/schema";
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

export async function reviewSubmissionAction(formData: FormData): Promise<void> {
  await ensureAdmin();

  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision"));
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isInteger(id)) return;
  if (decision !== "approved" && decision !== "rejected") return;

  await db
    .update(projects)
    .set({
      submissionStatus: decision,
      reviewerNote: note || null,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));

  revalidatePath("/admin");
  revalidatePath("/");
}

export type CategoryState = { error?: string };

export async function createCategoryAction(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Category name is too short." };
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

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  // projects.categoryId is ON DELETE SET NULL, so projects survive uncategorized.
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin");
  revalidatePath("/");
}
