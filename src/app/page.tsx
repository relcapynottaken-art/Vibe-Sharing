import Link from "next/link";
import { getCategories, getPublicProjects } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { GridIcon, PlusIcon, SparkIcon } from "@/components/icons";

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
    <div className="flex flex-col gap-12">
      <section className="relative text-center pt-10 pb-4">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-accent bg-accent-strong/10 border border-accent-strong/30 rounded-full px-3 py-1 mb-6">
          <SparkIcon className="text-sm" />
          Your vibecoded project hub
        </span>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05]">
          All your <span className="gradient-text">vibecoded</span>
          <br className="hidden sm:block" /> projects, one home.
        </h1>
        <p className="text-muted mt-5 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
          Collect everything you build, show off what you want, and let the
          community submit their own — reviewed before they go live.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/dashboard/new" className="btn btn-primary px-6 py-3">
            <PlusIcon className="text-base" />
            Submit a project
          </Link>
          <Link href="/signup" className="btn btn-ghost px-6 py-3">
            Create account
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-5 text-sm text-muted">
          <GridIcon className="text-base" />
          <span className="font-medium text-foreground">Explore projects</span>
          <span className="ml-auto">{projects.length} shown</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-7">
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
          <div className="surface rounded-2xl text-center py-20 px-6">
            <div className="text-foreground/15 text-5xl flex justify-center mb-3">
              <GridIcon />
            </div>
            <p className="text-muted">No projects here yet. Be the first.</p>
            <Link
              href="/dashboard/new"
              className="btn btn-primary px-5 py-2.5 mt-5"
            >
              <PlusIcon className="text-base" />
              Add a project
            </Link>
          </div>
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
    <Link href={href} className={`chip ${active ? "chip-active" : ""}`}>
      {label}
    </Link>
  );
}
