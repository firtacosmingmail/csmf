import type { Database } from "@csmf/supabase";

type PostBlock = Database["public"]["Tables"]["post_blocks"]["Row"];

// Reused by the admin editor's preview (Phase 05) — keep block-type
// rendering here rather than duplicating it per page.
export function PostBlocksRenderer({ blocks }: { blocks: PostBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => (
        <PostBlockView key={block.id} block={block} />
      ))}
    </div>
  );
}

function PostBlockView({ block }: { block: PostBlock }) {
  const content = block.content as Record<string, unknown>;

  switch (block.type) {
    // content.text is HTML produced by the block editor's Tiptap instance
    // (bold/italic/inline-code/link only — see components/block-editor/) —
    // safe to render directly since only the authenticated admin ever
    // writes it, never a visitor.
    case "heading":
      return <h2 className="font-serif text-2xl text-ink" dangerouslySetInnerHTML={{ __html: String(content.text ?? "") }} />;
    case "subheading":
      return <h3 className="font-serif text-xl text-ink" dangerouslySetInnerHTML={{ __html: String(content.text ?? "") }} />;
    case "paragraph":
      return <p className="font-sans text-ink" dangerouslySetInnerHTML={{ __html: String(content.text ?? "") }} />;
    case "code":
      // content.highlightedHtml is precomputed Shiki output (see
      // lib/shiki.ts) — only the public blog page bothers, so the editor's
      // own preview falls back to plain unhighlighted text.
      return typeof content.highlightedHtml === "string" ? (
        <div
          className="overflow-x-auto rounded border border-border font-mono text-sm [&_pre]:p-4"
          dangerouslySetInnerHTML={{ __html: content.highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto rounded border border-border bg-paper-raised p-4 font-mono text-sm text-ink">
          <code>{String(content.code ?? "")}</code>
        </pre>
      );
    case "separator":
      return <hr className="border-border" />;
    case "image": {
      const url = typeof content.url === "string" ? content.url : null;
      if (!url) return null;
      const sourceText = typeof content.source_text === "string" ? content.source_text : null;
      const sourceUrl = typeof content.source_url === "string" ? content.source_url : null;
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- block image URLs are arbitrary user uploads, not known at build time */}
          <img src={url} alt={String(content.alt_text ?? "")} className="w-full rounded" />
          {(content.caption || (sourceText && sourceUrl)) && (
            <figcaption className="mt-1 text-sm text-ink-muted">
              {typeof content.caption === "string" && content.caption}
              {sourceText && sourceUrl && (
                <>
                  {content.caption ? " — " : ""}
                  <a href={sourceUrl} className="underline hover:text-ink" target="_blank" rel="noopener noreferrer">
                    {sourceText}
                  </a>
                </>
              )}
            </figcaption>
          )}
        </figure>
      );
    }
    default:
      return null;
  }
}
