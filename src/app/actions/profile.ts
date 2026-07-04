"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";

export type ProfileState = { error?: string; success?: boolean };

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    bio: formData.get("bio") ?? "",
    avatarUrl: formData.get("avatarUrl") ?? "",
    websiteUrl: formData.get("websiteUrl") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { displayName, bio, avatarUrl, websiteUrl } = parsed.data;

  await db
    .update(users)
    .set({
      displayName: displayName ? displayName : null,
      bio: bio ? bio : null,
      avatarUrl: avatarUrl ? avatarUrl : null,
      websiteUrl: websiteUrl ? websiteUrl : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/dashboard/profile");
  revalidatePath(`/u/${user.username}`);
  return { success: true };
}
