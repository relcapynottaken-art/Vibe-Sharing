import Link from "next/link";
import { getCategories, getPublicProjects } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, projects] = await Promise.all([
    getCategories(),
    getPublicProjects(category),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section className="text-center pt-6 pb-2">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          All your <span className="gradient-text">vibecoded</span> projects,
          <br className="hidden sm:block" /> one shareable home.
        </h1>
        <p className="text-muted mt-4 max-w-xl mx-auto">
          Browse projects published by the community and the curator. Got
          something you built? Submit it for review.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link
            href="/dashboard/new"
            className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            Submit a project
          </Link>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap gap-2 mb-6">
          <CategoryChip slug={undefined} active={!category} label="All" />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              slug={c.slug}
              active={category === c.slug}
              label={c.name}
            />
          ))}
        </div>

        {projects.length === 0 ? (
          <p className="text-muted text-center py-16 border border-dashed border-border rounded-2xl">
            No projects here yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryChip({
  slug,
  active,
  label,
}: {
  slug?: string;
  active: boolean;
  label: string;
}) {
  const href = slug ? `/?category=${slug}` : "/";
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
        active
          ? "bg-accent text-white border-accent"
          : "border-border text-muted hover:bg-surface-2"
      }`}
    >
      {label}
    </Link>
  );
}
