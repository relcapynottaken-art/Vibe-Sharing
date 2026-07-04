import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { updateProfileAction } from "@/app/actions/profile";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfileSettingsPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);
  if (!profile) redirect("/login");

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-1">Edit profile</h1>
      <p className="text-muted text-sm mb-6">
        This shows up on your public profile page.
      </p>
      <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/20">
        <ProfileForm action={updateProfileAction} profile={profile} />
      </div>
    </div>
  );
}
