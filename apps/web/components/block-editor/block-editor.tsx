"use client";

import { useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { BlockItem } from "./block-item";
import { InsertMenu } from "./insert-menu";
import { PostBlocksRenderer } from "@/components/post-blocks-renderer";
import { normalizeOrder } from "@/lib/block-order";
import { createBlockAction, updateBlockAction, deleteBlockAction } from "@/app/admin/posts/[id]/edit/block-actions";
import type { PostBlock } from "@/lib/api/blocks";

function withNormalizedOrder(list: PostBlock[]): PostBlock[] {
  const normalized = normalizeOrder(list);
  return list.map((block, i) => ({ ...block, display_order: normalized[i].display_order }));
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
      content: { text: "" },
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

  async function handleContentSave(id: string, text: string) {
    const updated = await updateBlockAction(id, { content: { text } });
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

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setPreviewMode((p) => !p)}
        className="self-start rounded border border-border px-3 py-1 text-sm text-ink-muted hover:bg-paper-raised hover:text-ink"
      >
        {previewMode ? "Back to editing" : "Preview"}
      </button>

      {previewMode ? (
        <div className="flex flex-col gap-6 py-4">
          <header className="flex flex-col gap-2">
            <h1 className="font-serif text-4xl text-ink">{title}</h1>
            {subtitle && <p className="font-sans text-lg text-ink-muted">{subtitle}</p>}
          </header>
          <PostBlocksRenderer blocks={blocks} />
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
                    onSave={(text) => handleContentSave(block.id, text)}
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
