import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/data";
import { createProjectAction } from "@/app/actions/projects";
import { ProjectForm } from "@/components/ProjectForm";

export default async function NewProjectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const categories = await getCategories();

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-1">New project</h1>
      <p className="text-muted text-sm mb-6">
        Add a link to your vibecoded project and a screenshot.
      </p>
      <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/20">
        <ProjectForm
          action={createProjectAction}
          categories={categories}
          isAdmin={user.role === "admin"}
        />
      </div>
    </div>
  );
}
