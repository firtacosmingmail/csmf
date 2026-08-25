"use client";

import { useEffect, useMemo, useState } from "react";
import { debounce } from "@/lib/debounce";
import { CODE_LANGUAGES } from "@/lib/shiki-languages";
import { insertTab } from "@/lib/textarea-tab";

const AUTOSAVE_DELAY_MS = 800;

export function CodeBlockEditor({
  initialCode,
  initialLanguage,
  onSave,
}: {
  initialCode: string;
  initialLanguage: string;
  onSave: (content: { code: string; language: string }) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);

  const debouncedSave = useMemo(() => debounce(onSave, AUTOSAVE_DELAY_MS), [onSave]);

  useEffect(() => {
    const flush = () => debouncedSave.flush();
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      window.removeEventListener("beforeunload", flush);
    };
  }, [debouncedSave]);

  return (
    <div className="flex flex-col gap-1 rounded border border-border bg-paper-raised p-3">
      <select
        aria-label="Code language"
        value={language}
        onChange={(e) => {
          setLanguage(e.target.value);
          debouncedSave({ code, language: e.target.value });
        }}
        className="w-48 rounded border border-border bg-paper px-2 py-1 font-mono text-xs text-ink-muted"
      >
        <option value="">Plain text</option>
        {CODE_LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>
      <textarea
        aria-label="Code"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          debouncedSave({ code: e.target.value, language });
        }}
        onBlur={() => debouncedSave.flush()}
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          e.preventDefault();
          const el = e.currentTarget;
          const { text, cursor } = insertTab(code, el.selectionStart, el.selectionEnd);
          setCode(text);
          debouncedSave({ code: text, language });
          // The textarea's DOM value hasn't updated to `text` yet (React
          // hasn't re-rendered) — restore the cursor after it has.
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = cursor;
          });
        }}
        rows={6}
        placeholder="Code…"
        className="w-full resize-y rounded border border-border bg-paper px-3 py-2 font-mono text-sm text-ink"
      />
    </div>
  );
}
