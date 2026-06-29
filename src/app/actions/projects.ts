"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { projectSchema } from "@/lib/validation";

export type ProjectState = { error?: string };

function readProjectInput(formData: FormData) {
  const rawCategory = formData.get("categoryId");
  return projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    url: formData.get("url"),
    imageUrl: formData.get("imageUrl") ?? "",
    categoryId: rawCategory ? rawCategory : undefined,
  });
}

export async function createProjectAction(
  _prev: ProjectState,
  formData: FormData,
): Promise<ProjectState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = readProjectInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { title, description, url, imageUrl, categoryId } = parsed.data;

  const isAdmin = user.role === "admin";

  await db.insert(projects).values({
    ownerId: user.id,
    title,
    description: description ?? "",
    url,
    imageUrl: imageUrl ? imageUrl : null,
    categoryId: categoryId ?? null,
    // Admin projects: control visibility directly. They start private.
    // User projects: this is an application — goes to the review queue.
    isPublic: false,
    submissionStatus: isAdmin ? "none" : "pending",
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect("/dashboard");
}

export async function updateProjectAction(
  _prev: ProjectState,
  formData: FormData,
): Promise<ProjectState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Invalid project." };

  const [existing] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  if (!existing) return { error: "Project not found." };
  if (existing.ownerId !== user.id && user.role !== "admin") {
    return { error: "You do not have permission to edit this project." };
  }

  const parsed = readProjectInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { title, description, url, imageUrl, categoryId } = parsed.data;

  // Editing a previously-rejected user submission re-enters the review queue.
  const reentersReview =
    existing.submissionStatus === "rejected" && user.role !== "admin";

  await db
    .update(projects)
    .set({
      title,
      description: description ?? "",
      url,
      imageUrl: imageUrl ? imageUrl : null,
      categoryId: categoryId ?? null,
      submissionStatus: reentersReview ? "pending" : existing.submissionStatus,
      reviewerNote: reentersReview ? null : existing.reviewerNote,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));

  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect("/dashboard");
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  // Ownership enforced in the query: a non-admin can only delete their own.
  if (user.role === "admin") {
    await db.delete(projects).where(eq(projects.id, id));
  } else {
    await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.ownerId, user.id)));
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
}

// Admin-only: flip the public/hidden switch on one of their own projects.
export async function toggleVisibilityAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, user.id)))
    .limit(1);
  if (!existing) return;

  await db
    .update(projects)
    .set({ isPublic: !existing.isPublic, updatedAt: new Date() })
    .where(eq(projects.id, id));

  revalidatePath("/dashboard");
  revalidatePath("/");
}
