import Link from "next/link";
import { getCategories, getPublicProjects, type ProjectSort } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { SortSelect } from "@/components/SortSelect";
import { GridIcon, PlusIcon, SearchIcon, SparkIcon } from "@/components/icons";

const SORTS: ProjectSort[] = ["newest", "oldest", "name"];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>;
}) {
  const { category, q, sort: rawSort } = await searchParams;
  const sort: ProjectSort = SORTS.includes(rawSort as ProjectSort)
    ? (rawSort as ProjectSort)
    : "newest";
  const [categories, projects] = await Promise.all([
    getCategories(),
    getPublicProjects(category, { q, sort }),
  ]);

  return (
    <div className="flex flex-col gap-12">
      <section className="relative text-center pt-10 pb-4">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-accent bg-accent-strong/10 border border-accent-strong/30 rounded-full px-3 py-1 mb-6">
          <SparkIcon className="text-sm" />
          Your vibecoded project hub
        </span>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
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

        <form
          method="get"
          action="/"
          className="flex flex-col sm:flex-row gap-3 mb-5"
        >
          {category && <input type="hidden" name="category" value={category} />}
          <label className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-base" />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search projects…"
              aria-label="Search projects"
              className="input pl-9"
            />
          </label>
          <SortSelect defaultValue={sort} />
        </form>

        <div className="flex flex-wrap gap-2 mb-7">
          <CategoryChip
            slug={undefined}
            active={!category}
            label="All"
            q={q}
            sort={sort}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              slug={c.slug}
              active={category === c.slug}
              label={c.name}
              q={q}
              sort={sort}
            />
          ))}
        </div>

        {projects.length === 0 ? (
          <div className="glass rounded-2xl text-center py-20 px-6">
            <div className="text-white/15 text-5xl flex justify-center mb-3">
              <GridIcon />
            </div>
            <p className="text-muted">
              {q
                ? `No projects match "${q}".`
                : "No projects here yet. Be the first."}
            </p>
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
  q,
  sort,
}: {
  slug?: string;
  active: boolean;
  label: string;
  q?: string;
  sort?: string;
}) {
  const params = new URLSearchParams();
  if (slug) params.set("category", slug);
  if (q) params.set("q", q);
  if (sort && sort !== "newest") params.set("sort", sort);
  const qs = params.toString();
  const href = qs ? `/?${qs}` : "/";
  return (
    <Link href={href} className={`chip ${active ? "chip-active" : ""}`}>
      {label}
    </Link>
  );
}
