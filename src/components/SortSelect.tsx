"use client";

export function SortSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      name="sort"
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="input cursor-pointer w-auto"
      aria-label="Sort projects"
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="name">Name (A–Z)</option>
    </select>
  );
}
