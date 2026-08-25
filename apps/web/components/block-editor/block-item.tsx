"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RichTextBlock } from "./rich-text-block";
import { CodeBlockEditor } from "./code-block-editor";
import type { PostBlock } from "@/lib/api/blocks";

const TYPE_STYLES: Record<string, string> = {
  heading: "font-serif text-2xl text-ink",
  subheading: "font-serif text-xl text-ink",
  paragraph: "font-sans text-ink",
};

const TYPE_PLACEHOLDERS: Record<string, string> = {
  heading: "Heading",
  subheading: "Subheading",
  paragraph: "Write something…",
};

export function BlockItem({
  block,
  onSave,
  onDelete,
}: {
  block: PostBlock;
  onSave: (content: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const content = block.content as Record<string, unknown>;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-2 rounded px-2 py-1 hover:bg-paper-raised"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="mt-1 shrink-0 cursor-grab text-ink-muted opacity-0 group-hover:opacity-100"
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">
        {block.type === "code" ? (
          <CodeBlockEditor
            initialCode={typeof content.code === "string" ? content.code : ""}
            initialLanguage={typeof content.language === "string" ? content.language : ""}
            onSave={onSave}
          />
        ) : block.type === "separator" ? (
          <hr className="my-3 border-border" />
        ) : (
          <RichTextBlock
            initialText={typeof content.text === "string" ? content.text : ""}
            placeholder={TYPE_PLACEHOLDERS[block.type] ?? ""}
            className={TYPE_STYLES[block.type] ?? "font-sans text-ink"}
            onSave={(text) => onSave({ text })}
          />
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete block"
        className="mt-1 shrink-0 text-ink-muted opacity-0 hover:text-terracotta group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
