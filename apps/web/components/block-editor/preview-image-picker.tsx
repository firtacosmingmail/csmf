"use client";

import type { PostBlock } from "@/lib/api/blocks";

// Strip of thumbnails for the post's current image blocks — selecting one
// calls PATCH /posts/:id/preview-image; clicking the already-selected one
// clears it. Only nudges toward picking one (the small warning below) —
// per FLE-39, a post with no images publishes fine without one.
export function PreviewImagePicker({
  imageBlocks,
  selectedBlockId,
  onSelect,
}: {
  imageBlocks: PostBlock[];
  selectedBlockId: string | null;
  onSelect: (blockId: string | null) => void;
}) {
  if (imageBlocks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">Preview image</span>
        {!selectedBlockId && (
          <span className="text-xs text-terracotta">Choose one before publishing</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {imageBlocks.map((block) => {
          const content = block.content as Record<string, unknown>;
          const url = typeof content.url === "string" ? content.url : "";
          const selected = block.id === selectedBlockId;
          return (
            <button
              key={block.id}
              type="button"
              onClick={() => onSelect(selected ? null : block.id)}
              aria-label={selected ? "Selected preview image" : "Select as preview image"}
              aria-pressed={selected}
              className={`overflow-hidden rounded border-2 ${
                selected ? "border-terracotta" : "border-border"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image URL */}
              <img src={url} alt="" className="h-16 w-16 object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
