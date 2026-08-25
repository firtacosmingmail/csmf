"use client";

import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/lib/debounce";

const AUTOSAVE_DELAY_MS = 800;

const fieldClass = "rounded border border-border bg-paper px-2 py-1 text-sm text-ink";

// The block is only ever created once an upload has already produced a
// url (see BlockEditor.handleInsertImage) — this editor just fills in the
// caption/alt/source fields around a url that's already fixed.
export function ImageBlockEditor({
  url,
  initialAltText,
  initialCaption,
  initialSourceText,
  initialSourceUrl,
  onSave,
}: {
  url: string;
  initialAltText: string;
  initialCaption: string;
  initialSourceText: string;
  initialSourceUrl: string;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [altText, setAltText] = useState(initialAltText);
  const [caption, setCaption] = useState(initialCaption);
  const [sourceText, setSourceText] = useState(initialSourceText);
  const [sourceUrl, setSourceUrl] = useState(initialSourceUrl);

  const debouncedSave = useMemo(() => debounce(onSave, AUTOSAVE_DELAY_MS), [onSave]);

  useEffect(() => {
    const flush = () => debouncedSave.flush();
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      window.removeEventListener("beforeunload", flush);
    };
  }, [debouncedSave]);

  function save(overrides: Record<string, string>) {
    debouncedSave({
      url,
      alt_text: altText,
      caption,
      source_text: sourceText,
      source_url: sourceUrl,
      ...overrides,
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-border bg-paper-raised p-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- block image URLs are arbitrary uploads, not known at build time */}
      <img src={url} alt={altText} className="max-h-64 w-auto rounded" />
      <input
        aria-label="Alt text"
        value={altText}
        onChange={(e) => {
          setAltText(e.target.value);
          save({ alt_text: e.target.value });
        }}
        onBlur={() => debouncedSave.flush()}
        placeholder="Alt text"
        className={fieldClass}
      />
      <input
        aria-label="Caption"
        value={caption}
        onChange={(e) => {
          setCaption(e.target.value);
          save({ caption: e.target.value });
        }}
        onBlur={() => debouncedSave.flush()}
        placeholder="Caption"
        className={fieldClass}
      />
      <div className="flex gap-2">
        <input
          aria-label="Source text"
          value={sourceText}
          onChange={(e) => {
            setSourceText(e.target.value);
            save({ source_text: e.target.value });
          }}
          onBlur={() => debouncedSave.flush()}
          placeholder="Source text"
          className={`flex-1 ${fieldClass}`}
        />
        <input
          aria-label="Source URL"
          value={sourceUrl}
          onChange={(e) => {
            setSourceUrl(e.target.value);
            save({ source_url: e.target.value });
          }}
          onBlur={() => debouncedSave.flush()}
          placeholder="https://…"
          className={`flex-1 ${fieldClass}`}
        />
      </div>
    </div>
  );
}
