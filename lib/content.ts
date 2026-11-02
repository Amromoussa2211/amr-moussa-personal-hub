import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import GithubSlugger from "github-slugger";
import type { Heading, Root as MdastRoot, ListContent } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import { unified } from "unified";

import { visit } from "unist-util-visit";
import type { Plugin } from "unified";

import { getCategory } from "@/lib/categories";
import type { Difficulty } from "@/lib/format";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

export type Frontmatter = {
  title: string;
  subtitle?: string;
  description: string;
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  difficulty: Difficulty;
  draft?: boolean;
  featured?: boolean;
};

export type ArticleMeta = Omit<Frontmatter, "title" | "date" | "category" | "tags" | "difficulty"> & {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  difficulty: Difficulty;
  readingTime: number;
  excerpt: string;
  categoryDisplay: string;
};

export type Article = ArticleMeta & { html: string; toc: TocItem[] };

export type TiltMeta = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  draft?: boolean;
  readingTime: number;
};

export type Tilt = TiltMeta & { html: string };

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
const TIL_DIR = path.join(process.cwd(), "content", "til");
const CONTENT_EXTENSIONS = [".md", ".mdx"] as const;

/* ------------------------------------------------------------------ */
/* Markdown pipeline                                                   */
/* ------------------------------------------------------------------ */

const shikiRehype = rehypeShiki as unknown as Plugin<
  [{ themes: { light: string; dark: string }; defaultLanguage?: string }]
>;

function pipelineBase() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(shikiRehype, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultLanguage: "text",
    })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

function pipeline(collectToc?: (items: TocItem[]) => void) {
  if (!collectToc) return pipelineBase();
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkHeadingToc(collectToc))
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(shikiRehype, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultLanguage: "text",
    })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

/** Collect h2/h3 headings with github-slugger ids (mirrors rehype-slug). */
function remarkHeadingToc(collect: (items: TocItem[]) => void) {
  const plugin: Plugin<[], MdastRoot> = function () {
    return (tree: MdastRoot) => {
      const slugger = new GithubSlugger();
      const items: TocItem[] = [];
      visit(tree, "heading", (node: Heading) => {
        if (node.depth !== 2 && node.depth !== 3) return;
        const text = mdastToString(node);
        if (!text) return;
        items.push({ id: slugger.slug(text), text, depth: node.depth === 3 ? 3 : 2 });
      });
      collect(items);
    };
  };
  return plugin;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

interface RawFile {
  slug: string;
  data: Record<string, unknown>;
  content: string;
}

function readFiles(dir: string): RawFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => (CONTENT_EXTENSIONS as readonly string[]).some((e) => f.endsWith(e)))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      return { slug: file.replace(/\.(md|mdx)$/, ""), data, content };
    });
}

function computeReadingTime(markdown: string): number {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#>*_~[\]()!|-]/g, " ");
  const words = prose.split(/\s+/).filter(Boolean).length;
  const codeFences = (markdown.match(/```(?=\w)/g) ?? []).length;
  // prose at ~220 wpm; each fenced block adds ~15s of scanning
  return Math.max(1, Math.round(words / 220 + codeFences * 0.25 * 60 / 60));
}

function extractExcerpt(markdown: string, fallback: string): string {
  const body = markdown.replace(/^> /gm, "");
  const first = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(
      (p) =>
        p.length > 60 && !p.startsWith("#") && !p.startsWith("```") && !p.startsWith("|")
    )
    .at(0);
  if (!first) return fallback;
  return first
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s/)
    .slice(0, 2)
    .join(" ");
}

/* ------------------------------------------------------------------ */
/* Articles                                                            */
/* ------------------------------------------------------------------ */

export function getArticleMetas(): ArticleMeta[] {
  return readFiles(ARTICLES_DIR)
    .map(({ slug, data, content }): ArticleMeta => {
      const fm = data as Partial<Frontmatter>;
      const cat = getCategory(fm.category ?? "");
      return {
        slug,
        title: typeof fm.title === "string" && fm.title ? fm.title : slug,
        subtitle: typeof fm.subtitle === "string" ? fm.subtitle : undefined,
        description: typeof fm.description === "string" ? fm.description : "",
        date: typeof fm.date === "string" ? fm.date : "",
        updated: typeof fm.updated === "string" ? fm.updated : undefined,
        category: typeof fm.category === "string" ? fm.category : "",
        categoryDisplay: cat?.name ?? fm.category ?? "",
        tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
        difficulty: (fm.difficulty ?? "Intermediate") as Difficulty,
        draft: fm.draft === true,
        featured: fm.featured === true,
        readingTime: computeReadingTime(content),
        excerpt: fm.description || extractExcerpt(content, ""),
      };
    })
    .filter((a) => !a.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const found = readFiles(ARTICLES_DIR).find((a) => a.slug === slug);
  if (!found) return null;

  const fm = found.data as Partial<Frontmatter>;
  let toc: TocItem[] = [];
  const vfile = await pipeline((items) => (toc = items)).process(found.content + "\n");
  const html = String(vfile);

  const meta = getArticleMetas().find((m) => m.slug === slug);
  const cat = getCategory(fm.category ?? "");

  return {
    slug,
    title: fm.title ?? slug,
    subtitle: typeof fm.subtitle === "string" ? fm.subtitle : undefined,
    description: typeof fm.description === "string" ? fm.description : "",
    date: fm.date ?? "",
    updated: typeof fm.updated === "string" ? fm.updated : undefined,
    category: fm.category ?? "",
    categoryDisplay: cat?.name ?? fm.category ?? "",
    tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
    difficulty: (fm.difficulty ?? "Intermediate") as Difficulty,
    draft: fm.draft === true,
    featured: fm.featured === true,
    readingTime: meta?.readingTime ?? 1,
    excerpt: meta?.excerpt ?? "",
    html,
    toc,
  };
}

export function getAdjacentArticles(slug: string) {
  const metas = getArticleMetas();
  const idx = metas.findIndex((m) => m.slug === slug);
  return {
    newer: idx > 0 ? metas[idx - 1] : null,
    older: idx >= 0 && idx < metas.length - 1 ? metas[idx + 1] : null,
  };
}

/* ------------------------------------------------------------------ */
/* Today I Learned                                                     */
/* ------------------------------------------------------------------ */

export function getTiltMetas(): TiltMeta[] {
  return readFiles(TIL_DIR)
    .map(({ slug, data, content }): TiltMeta => ({
      slug,
      title: typeof data.title === "string" && data.title ? data.title : slug,
      date: typeof data.date === "string" ? data.date : "",
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      draft: data.draft === true,
      readingTime: computeReadingTime(content),
    }))
    .filter((t) => !t.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getTiltBySlug(slug: string): Promise<Tilt | null> {
  const found = readFiles(TIL_DIR).find((t) => t.slug === slug);
  if (!found) return null;
  const vfile = await pipeline().process(found.content + "\n");
  const html = String(vfile);
  return {
    slug,
    title: typeof found.data.title === "string" && found.data.title ? found.data.title : slug,
    date: typeof found.data.date === "string" ? found.data.date : "",
    tags: Array.isArray(found.data.tags) ? (found.data.tags as string[]) : [],
    readingTime: computeReadingTime(found.content),
    html,
  };
}

export type { ListContent };
