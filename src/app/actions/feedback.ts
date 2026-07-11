"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { feedback, projects, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { feedbackSchema } from "@/lib/validation";

export type FeedbackState = { error?: string };

export async function createFeedbackAction(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projectId = Number(formData.get("projectId"));
  if (!Number.isInteger(projectId)) return { error: "Invalid project." };

  const parsed = feedbackSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const rl = await rateLimit(`feedback:${user.id}`, {
    limit: 10,
    windowSec: 3600,
  });
  if (!rl.success) {
    return { error: "You're leaving feedback too fast. Try again later." };
  }

  // Feedback is only allowed on publicly visible projects, and not on your
  // own (it feeds the owner's tier, so self-feedback would inflate it).
  const [target] = await db
    .select({
      id: projects.id,
      ownerId: projects.ownerId,
      isPublic: projects.isPublic,
      submissionStatus: projects.submissionStatus,
      ownerRole: users.role,
    })
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!target) return { error: "Project not found." };
  const isPubliclyVisible =
    (target.ownerRole === "admin" && target.isPublic) ||
    target.submissionStatus === "approved";
  if (!isPubliclyVisible) return { error: "Project not found." };
  if (target.ownerId === user.id) {
    return { error: "You can't leave feedback on your own project." };
  }

  try {
    await db
      .insert(feedback)
      .values({ projectId, authorId: user.id, body: parsed.data.body });
  } catch {
    // Unique (projectId, authorId) violation — one feedback per project.
    return { error: "You already left feedback on this project." };
  }

  revalidatePath(`/project/${projectId}`);
  return {};
}

export async function deleteFeedbackAction(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "Invalid feedback." };

  // Authors can remove their own feedback; the admin can moderate any.
  const ownership =
    user.role === "admin"
      ? eq(feedback.id, id)
      : and(eq(feedback.id, id), eq(feedback.authorId, user.id));
  const deleted = await db
    .delete(feedback)
    .where(ownership)
    .returning({ projectId: feedback.projectId });
  if (deleted.length === 0) return { error: "Feedback not found." };

  revalidatePath(`/project/${deleted[0].projectId}`);
  return {};
}
