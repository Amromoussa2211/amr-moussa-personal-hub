import { ImageResponse } from "next/og";

import { getArticleMetas } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Article by Amr Moussa";

export default async function ArticleOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleMetas().find((a) => a.slug === slug);
  const title = article?.title ?? "Article";
  const category = article?.categoryDisplay ?? "Articles";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "#38bdf8",
              color: "#0f172a",
              fontSize: 24,
              fontWeight: 700,
              padding: "8px 20px",
              borderRadius: 999,
            }}
          >
            {category.toUpperCase()}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#64748b" }}>
            Amr Moussa
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 90 ? 52 : 64,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#38bdf8", letterSpacing: 3 }}>
          AMRMOUSSA-HUB.VERCEL.APP
        </div>
      </div>
    ),
    size
  );
}
