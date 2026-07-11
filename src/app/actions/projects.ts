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
    imageUrl: formData.get("imageUrl"),
    projectType: formData.get("projectType"),
    pricing: formData.get("pricing"),
    categoryId: rawCategory ? rawCategory : undefined,
    visibility: formData.get("visibility") ?? undefined,
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
  const {
    title,
    description,
    url,
    imageUrl,
    projectType,
    pricing,
    categoryId,
    visibility,
  } = parsed.data;

  const isAdmin = user.role === "admin";

  // Admins manage visibility with their own toggle (starts hidden).
  // A user can keep a project private (no review) or request it be made
  // public, which sends it to the admin review queue.
  const submissionStatus = isAdmin
    ? "none"
    : visibility === "public"
      ? "pending"
      : "none";

  await db.insert(projects).values({
    ownerId: user.id,
    title,
    description: description ?? "",
    url,
    imageUrl,
    projectType,
    pricing,
    categoryId: categoryId ?? null,
    isPublic: false,
    submissionStatus,
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
  const {
    title,
    description,
    url,
    imageUrl,
    projectType,
    pricing,
    categoryId,
    visibility,
  } = parsed.data;

  // Recompute moderation state for non-admins based on their private/public
  // choice. Going private clears any review state. Going public — or editing
  // the content of an already-approved project — (re-)enters the review
  // queue: approval covered what the admin saw at review time, not whatever
  // the project is edited into afterwards. Admins keep their own state.
  let submissionStatus = existing.submissionStatus;
  let reviewerNote = existing.reviewerNote;
  if (user.role !== "admin") {
    if (visibility === "public") {
      const contentChanged =
        title !== existing.title ||
        (description ?? "") !== existing.description ||
        url !== existing.url ||
        imageUrl !== existing.imageUrl;
      if (existing.submissionStatus !== "approved" || contentChanged) {
        submissionStatus = "pending";
        reviewerNote = null;
      }
    } else {
      submissionStatus = "none";
      reviewerNote = null;
    }
  }

  await db
    .update(projects)
    .set({
      title,
      description: description ?? "",
      url,
      imageUrl,
      projectType,
      pricing,
      categoryId: categoryId ?? null,
      submissionStatus,
      reviewerNote,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));

  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect("/dashboard");
}

export async function deleteProjectAction(
  _prev: ProjectState,
  formData: FormData,
): Promise<ProjectState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Invalid project." };

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
  return {};
}

// Owner (or admin): pin/unpin a project so it sorts first on the profile.
export async function togglePinAction(
  _prev: ProjectState,
  formData: FormData,
): Promise<ProjectState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Invalid project." };

  const ownership =
    user.role === "admin"
      ? eq(projects.id, id)
      : and(eq(projects.id, id), eq(projects.ownerId, user.id));
  const [existing] = await db
    .select({ id: projects.id, isPinned: projects.isPinned })
    .from(projects)
    .where(ownership)
    .limit(1);
  if (!existing) return { error: "Project not found." };

  await db
    .update(projects)
    .set({ isPinned: !existing.isPinned, updatedAt: new Date() })
    .where(eq(projects.id, id));

  revalidatePath("/dashboard");
  revalidatePath(`/u/${user.username}`);
  return {};
}

// Admin-only: flip the public/hidden switch on one of their own projects.
export async function toggleVisibilityAction(
  _prev: ProjectState,
  formData: FormData,
): Promise<ProjectState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Invalid project." };

  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, user.id)))
    .limit(1);
  if (!existing) return { error: "Project not found." };

  await db
    .update(projects)
    .set({ isPublic: !existing.isPublic, updatedAt: new Date() })
    .where(eq(projects.id, id));

  revalidatePath("/dashboard");
  revalidatePath("/");
  return {};
}
