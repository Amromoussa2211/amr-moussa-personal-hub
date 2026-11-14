import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Amr Moussa — QA Engineering, Automation & AI";

export default function OgImage() {
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
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#38bdf8", letterSpacing: 4 }}>
          AMRMOUSSA-HUB.VERCEL.APP
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700, lineHeight: 1.1 }}>
            Amr Moussa
          </div>
          <div style={{ display: "flex", fontSize: 38, color: "#94a3b8", marginTop: 20 }}>
            Senior QA Engineer · Test Automation Lead
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#38bdf8", marginTop: 12 }}>
            Engineering Quality. Automating Confidence. Exploring AI.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#64748b" }}>
          Original articles · automation architecture · AI-powered testing
        </div>
      </div>
    ),
    size
  );
}
