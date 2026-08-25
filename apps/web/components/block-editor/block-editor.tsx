"use client";

import { useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { BlockItem } from "./block-item";
import { InsertMenu } from "./insert-menu";
import { PostBlocksRenderer } from "@/components/post-blocks-renderer";
import { normalizeOrder } from "@/lib/block-order";
import {
  createBlockAction,
  updateBlockAction,
  deleteBlockAction,
  highlightBlocksAction,
} from "@/app/admin/posts/[id]/edit/block-actions";
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
}: {
  postId: string;
  initialBlocks: PostBlock[];
  title: string;
  subtitle: string | null;
}) {
  const [blocks, setBlocks] = useState<PostBlock[]>(initialBlocks);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewBlocks, setPreviewBlocks] = useState<PostBlock[]>(initialBlocks);
  const [preparingPreview, setPreparingPreview] = useState(false);

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

  async function handleInsert(type: string, afterIndex: number) {
    const block = await createBlockAction(postId, {
      type,
      content: initialContentFor(type),
      display_order: afterIndex + 1,
    });
    const next = [...blocks];
    next.splice(afterIndex + 1, 0, block);
    await persistOrder(next, blocks);
  }

  async function handleDelete(id: string) {
    await deleteBlockAction(id);
    const next = blocks.filter((b) => b.id !== id);
    await persistOrder(next, blocks);
  }

  async function handleContentSave(id: string, content: Record<string, unknown>) {
    const updated = await updateBlockAction(id, { content });
    setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    void persistOrder(arrayMove(blocks, oldIndex, newIndex), blocks);
  }

  // Syntax highlighting needs a server runtime (Shiki), so entering
  // preview fetches highlighted code blocks the same way the public page
  // renders them, rather than falling back to plain text.
  async function handleTogglePreview() {
    if (previewMode) {
      setPreviewMode(false);
      return;
    }
    setPreparingPreview(true);
    try {
      setPreviewBlocks(await highlightBlocksAction(blocks));
      setPreviewMode(true);
    } finally {
      setPreparingPreview(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
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
          <InsertMenu onInsert={(type) => handleInsert(type, -1)} />
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block, index) => (
                <div key={block.id} className="flex flex-col gap-1">
                  <BlockItem
                    block={block}
                    onSave={(content) => handleContentSave(block.id, content)}
                    onDelete={() => handleDelete(block.id)}
                  />
                  <InsertMenu onInsert={(type) => handleInsert(type, index)} />
                </div>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
