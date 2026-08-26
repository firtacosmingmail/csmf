import { ImageResponse } from "next/og";
import { authorName } from "@/lib/site";

// Default OG/Twitter image (FLE-56), used wherever a page has no more
// specific image of its own (post pages without a preview image, the
// home/about pages). Referenced explicitly by URL from each page's
// generateMetadata rather than relied on as an implicit file-convention
// fallback, so it's unambiguous which image a given page ends up with.
export const alt = `${authorName} — csmf`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          padding: "96px",
        }}
      >
        <div style={{ display: "flex", width: 72, height: 10, backgroundColor: "#e0916b", marginBottom: 48 }} />
        <div style={{ display: "flex", fontSize: 96, color: "#f2efe9", fontWeight: 700 }}>{authorName}</div>
        <div style={{ display: "flex", fontSize: 40, color: "#9b958a", marginTop: 28 }}>
          Software engineering — notes, projects and tutorials
        </div>
      </div>
    ),
    { ...size },
  );
}
