import { getArticleMetas, getTiltMetas } from "@/lib/content";

export const dynamic = "force-dynamic";

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  const articles = getArticleMetas().slice(0, 20);
  const tils = getTiltMetas().slice(0, 20);

  const items = [
    ...articles.map((a) => ({
      title: a.title,
      description: a.description || a.excerpt,
      link: `${base}/articles/${a.slug}`,
      date: a.updated ?? a.date,
    })),
    ...tils.map((t) => ({
      title: t.title,
      description: t.title,
      link: `${base}/til/${t.slug}`,
      date: t.date,
    })),
  ].sort((x, y) => y.date.localeCompare(x.date));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Amr Moussa — QA Engineering, Automation &amp; AI</title>
<link>${base}</link>
<description>Original, practical writing on QA engineering, Playwright, performance testing, and AI-powered testing.</description>
<language>en</language>
<atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (i) => `<item>
<title>${escapeXml(i.title)}</title>
<description>${escapeXml(i.description)}</description>
<link>${i.link}</link>
<guid>${i.link}</guid>
<pubDate>${new Date(i.date + "T09:00:00Z").toUTCString()}</pubDate>
</item>`
  )
  .join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
