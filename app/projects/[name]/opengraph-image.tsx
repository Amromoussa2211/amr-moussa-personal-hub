import { ImageResponse } from "next/og";

import { getProjects } from "@/lib/github";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Project by Amr Moussa";

export default async function ProjectOgImage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const projects = await getProjects();
  const project = projects.find((p) => p.name === decoded);

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
            {(project?.areaOfFocus ?? "Project").toUpperCase()}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#64748b" }}>Amr Moussa</div>
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 700, fontFamily: "monospace" }}>
          {decoded}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#38bdf8", letterSpacing: 3 }}>
          AMRMOUSSA-HUB.VERCEL.APP
        </div>
      </div>
    ),
    size
  );
}
