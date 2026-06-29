import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/data";
import { updateProjectAction } from "@/app/actions/projects";
import { ProjectForm } from "@/components/ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) notFound();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) notFound();
  if (project.ownerId !== user.id && user.role !== "admin") {
    redirect("/dashboard");
  }

  const categories = await getCategories();

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit project</h1>
      <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/20">
        <ProjectForm
          action={updateProjectAction}
          categories={categories}
          project={project}
          isAdmin={user.role === "admin"}
        />
      </div>
    </div>
  );
}
