"use client";

import { useState } from "react";

const BLOCK_OPTIONS: { type: string; label: string }[] = [
  { type: "heading", label: "Heading" },
  { type: "subheading", label: "Subheading" },
  { type: "paragraph", label: "Paragraph" },
  { type: "code", label: "Code" },
  { type: "separator", label: "Separator" },
];

export function InsertMenu({ onInsert }: { onInsert: (type: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Insert block"
        aria-expanded={open}
        className="rounded px-2 py-1 text-sm text-ink-muted hover:bg-paper-raised hover:text-ink"
      >
        +
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 flex flex-col rounded border border-border bg-paper-raised py-1 shadow-md">
          {BLOCK_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => {
                onInsert(opt.type);
                setOpen(false);
              }}
              className="whitespace-nowrap px-3 py-1 text-left text-sm text-ink hover:bg-paper"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
