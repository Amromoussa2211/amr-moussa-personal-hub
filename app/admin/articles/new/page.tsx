import Link from "next/link";

import { createArticleAction } from "../actions";

const CATEGORIES = [
  { slug: "qa-fundamentals", name: "QA Fundamentals" },
  { slug: "advanced-qa", name: "Advanced QA Engineering" },
  { slug: "automation", name: "Playwright & Automation" },
  { slug: "mobile", name: "Mobile Automation" },
  { slug: "api", name: "API & Backend Testing" },
  { slug: "performance", name: "Performance Engineering" },
  { slug: "ai-testing", name: "AI & Agentic QA" },
  { slug: "software-engineering", name: "Software Engineering" },
  { slug: "tutorials", name: "Tutorials" },
];

export default function AdminNewArticlePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <nav className="text-[12px] text-faint">
          <Link href="/admin/articles" className="hover:text-ink">Articles</Link>
          <span className="mx-1.5">/</span>
          <span className="text-muted">new</span>
        </nav>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">New article</h1>
        <p className="mt-1 text-sm text-muted">
          Creates the article (status IDEA) plus its first draft version.
        </p>
      </header>

      <form action={createArticleAction} className="space-y-4 rounded-2xl border border-hairline bg-surface p-6">
        <div>
          <label htmlFor="title" className="mb-1 block text-[13px] font-medium text-ink">Title</label>
          <input
            id="title"
            name="title"
            required
            className="w-full rounded-xl border border-hairline bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="slug" className="mb-1 block text-[13px] font-medium text-ink">
            Slug <span className="text-faint">(URL segment, lowercase-with-dashes)</span>
          </label>
          <input
            id="slug"
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className="w-full rounded-xl border border-hairline bg-paper px-3.5 py-2.5 font-mono text-[13px] text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-[13px] font-medium text-ink">
            Description / premise
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-xl border border-hairline bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="categorySlug" className="mb-1 block text-[13px] font-medium text-ink">Category</label>
          <select
            id="categorySlug"
            name="categorySlug"
            className="w-full rounded-xl border border-hairline bg-paper px-3 py-2.5 text-sm text-ink"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="body" className="mb-1 block text-[13px] font-medium text-ink">
            First draft (markdown, optional)
          </label>
          <textarea
            id="body"
            name="body"
            rows={10}
            className="w-full rounded-xl border border-hairline bg-paper px-4 py-3 font-mono text-[13px] text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
        >
          Create article
        </button>
      </form>
    </div>
  );
}
