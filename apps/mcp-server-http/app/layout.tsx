import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "csmf-blog MCP server",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
