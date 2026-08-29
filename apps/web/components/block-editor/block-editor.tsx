"use client";

import { useState, type ReactNode } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { BlockItem } from "./block-item";
import { InsertMenu } from "./insert-menu";
import { PreviewImagePicker } from "./preview-image-picker";
import { PostBlocksRenderer } from "@/components/post-blocks-renderer";
import { normalizeOrder } from "@/lib/block-order";
import {
  createBlockAction,
  updateBlockAction,
  deleteBlockAction,
  highlightBlocksAction,
  uploadImageAction,
  setPreviewImageAction,
} from "@/app/admin/(dashboard)/posts/[id]/edit/block-actions";
import type { PostBlock } from "@/lib/api/blocks";

function withNormalizedOrder(list: PostBlock[]): PostBlock[] {
  const normalized = normalizeOrder(list);
  return list.map((block, i) => ({ ...block, display_order: normalized[i].display_order }));
}

// Seeds a new block's initial content by type, matching what each editor
// (RichTextBlock/CodeBlockEditor/none) expects to find already there.
function initialContentFor(type: string): Record<string, unknown> {
  switch (type) {
    case "code":
      return { code: "", language: "" };
    case "separator":
      return {};
    default:
      return { text: "" };
  }
}

export function BlockEditor({
  postId,
  initialBlocks,
  title,
  subtitle,
  initialPreviewImageBlockId,
  metadataPanel,
}: {
  postId: string;
  initialBlocks: PostBlock[];
  title: string;
  subtitle: string | null;
  initialPreviewImageBlockId: string | null;
  // The post-metadata form (title/slug/status/…) — a sibling concern the
  // page owns, but it needs to sit in the same sidebar column as the
  // preview-image picker below, which does live here. Taking it as a slot
  // keeps both cards true DOM siblings under one <aside>, so they stack
  // with plain flexbox instead of needing a row-spanning grid item (which
  // otherwise inflates row tracks to match this component's often much
  // taller content column).
  metadataPanel?: ReactNode;
}) {
  const [blocks, setBlocks] = useState<PostBlock[]>(initialBlocks);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewBlocks, setPreviewBlocks] = useState<PostBlock[]>(initialBlocks);
  const [preparingPreview, setPreparingPreview] = useState(false);
  const [previewImageBlockId, setPreviewImageBlockId] = useState(initialPreviewImageBlockId);
  const [error, setError] = useState<string | null>(null);

  // These handlers are imperative onClick/onBlur calls, not <form
  // action={...}> — Next.js's error.tsx boundary only catches the latter,
  // so a thrown error here would otherwise just be a silent unhandled
  // rejection. Routes every mutation through this so a failure always
  // surfaces as a visible, dismissible message instead.
  async function guarded(fn: () => Promise<void>) {
    try {
      setError(null);
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  // Persists the new positions for whichever blocks moved, and updates
  // local state to match — every insert/delete/reorder routes through this
  // so display_order stays a dense, unique sequence.
  async function persistOrder(newList: PostBlock[], previousList: PostBlock[]) {
    const normalized = withNormalizedOrder(newList);
    setBlocks(normalized);
    await Promise.all(
      normalized
        .filter((block) => previousList.find((p) => p.id === block.id)?.display_order !== block.display_order)
        .map((block) => updateBlockAction(block.id, { display_order: block.display_order })),
    );
  }

  function handleInsert(type: string, afterIndex: number) {
    void guarded(async () => {
      const block = await createBlockAction(postId, {
        type,
        content: initialContentFor(type),
        display_order: afterIndex + 1,
      });
      const next = [...blocks];
      next.splice(afterIndex + 1, 0, block);
      await persistOrder(next, blocks);
    });
  }

  function handleInsertImage(file: File, afterIndex: number) {
    void guarded(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await uploadImageAction(formData);
      const block = await createBlockAction(postId, {
        type: "image",
        content: { url },
        display_order: afterIndex + 1,
      });
      // Mirrors the backend: the first image block added auto-becomes the
      // preview image (POST /posts/:id/blocks does this server-side
      // already — this just keeps local state in sync without a refresh).
      setPreviewImageBlockId((current) => current ?? block.id);
      const next = [...blocks];
      next.splice(afterIndex + 1, 0, block);
      await persistOrder(next, blocks);
    });
  }

  function handleDelete(id: string) {
    void guarded(async () => {
      await deleteBlockAction(id);
      const next = blocks.filter((b) => b.id !== id);
      await persistOrder(next, blocks);
      if (id === previewImageBlockId) setPreviewImageBlockId(null);
    });
  }

  function handleSelectPreviewImage(blockId: string | null) {
    void guarded(async () => {
      setPreviewImageBlockId(blockId);
      await setPreviewImageAction(postId, blockId);
    });
  }

  function handleContentSave(id: string, content: Record<string, unknown>) {
    void guarded(async () => {
      const updated = await updateBlockAction(id, { content });
      setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    void guarded(() => persistOrder(arrayMove(blocks, oldIndex, newIndex), blocks));
  }

  // Syntax highlighting needs a server runtime (Shiki), so entering
  // preview fetches highlighted code blocks the same way the public page
  // renders them, rather than falling back to plain text.
  function handleTogglePreview() {
    if (previewMode) {
      setPreviewMode(false);
      return;
    }
    void guarded(async () => {
      setPreparingPreview(true);
      try {
        setPreviewBlocks(await highlightBlocksAction(blocks));
        setPreviewMode(true);
      } finally {
        setPreparingPreview(false);
      }
    });
  }

  const imageBlocks = blocks.filter((b) => b.type === "image");
  const showPreviewImagePicker = !previewMode && imageBlocks.length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="flex flex-col gap-2">
        {error && (
          <div className="flex items-center justify-between gap-3 rounded border border-terracotta bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="shrink-0">
              ×
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleTogglePreview}
          disabled={preparingPreview}
          className="self-start rounded border border-border px-3 py-1 text-sm text-ink-muted hover:bg-paper-raised hover:text-ink disabled:opacity-50"
        >
          {previewMode ? "Back to editing" : preparingPreview ? "Preparing preview…" : "Preview"}
        </button>

        {previewMode ? (
          <div className="flex flex-col gap-6 py-4">
            <header className="flex flex-col gap-2">
              <h1 className="font-serif text-4xl text-ink">{title}</h1>
              {subtitle && <p className="font-sans text-lg text-ink-muted">{subtitle}</p>}
            </header>
            <PostBlocksRenderer blocks={previewBlocks} />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <InsertMenu
              onInsert={(type) => handleInsert(type, -1)}
              onInsertImage={(file) => handleInsertImage(file, -1)}
            />
            {blocks.length === 0 && <p className="text-sm text-ink-muted">No content yet — use + to add a block.</p>}
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map((block, index) => (
                  <div key={block.id} className="flex flex-col gap-1">
                    <BlockItem
                      block={block}
                      onSave={(content) => handleContentSave(block.id, content)}
                      onDelete={() => handleDelete(block.id)}
                    />
                    <InsertMenu
                      onInsert={(type) => handleInsert(type, index)}
                      onInsertImage={(file) => handleInsertImage(file, index)}
                    />
                  </div>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {(metadataPanel || showPreviewImagePicker) && (
        <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          {metadataPanel && <div className="rounded border border-border bg-paper-raised p-4">{metadataPanel}</div>}
          {showPreviewImagePicker && (
            <div className="flex flex-col gap-3 rounded border border-border bg-paper-raised p-4">
              <PreviewImagePicker
                imageBlocks={imageBlocks}
                selectedBlockId={previewImageBlockId}
                onSelect={handleSelectPreviewImage}
              />
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
