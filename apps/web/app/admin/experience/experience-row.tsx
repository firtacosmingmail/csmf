"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WorkExperience } from "@/lib/api/work-experience";

const fieldClass = "rounded border border-border bg-paper px-2 py-1 text-sm text-ink";

type ExperiencePatch = Partial<{
  company: string;
  role: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
}>;

export function ExperienceRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: WorkExperience;
  onUpdate: (patch: ExperiencePatch) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 rounded border border-border bg-paper-raised p-3">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="mt-1 shrink-0 cursor-grab text-ink-muted"
      >
        ⠿
      </button>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex gap-2">
          <input
            defaultValue={item.company}
            aria-label="Company"
            placeholder="Company"
            onBlur={(e) => {
              if (e.target.value !== item.company) onUpdate({ company: e.target.value });
            }}
            className={`flex-1 ${fieldClass}`}
          />
          <input
            defaultValue={item.role}
            aria-label="Role"
            placeholder="Role"
            onBlur={(e) => {
              if (e.target.value !== item.role) onUpdate({ role: e.target.value });
            }}
            className={`flex-1 ${fieldClass}`}
          />
        </div>
        <textarea
          defaultValue={item.description ?? ""}
          aria-label="Description"
          placeholder="Description"
          rows={2}
          onBlur={(e) => {
            if (e.target.value !== (item.description ?? "")) onUpdate({ description: e.target.value });
          }}
          className={fieldClass}
        />
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs text-ink-muted">
            Start date
            <input
              type="date"
              defaultValue={item.start_date ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (item.start_date ?? "")) onUpdate({ start_date: e.target.value || null });
              }}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-ink-muted">
            End date (blank = ongoing)
            <input
              type="date"
              defaultValue={item.end_date ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (item.end_date ?? "")) onUpdate({ end_date: e.target.value || null });
              }}
              className={fieldClass}
            />
          </label>
        </div>
      </div>
      <button type="button" onClick={onDelete} aria-label="Delete" className="shrink-0 text-terracotta hover:underline">
        ×
      </button>
    </div>
  );
}
