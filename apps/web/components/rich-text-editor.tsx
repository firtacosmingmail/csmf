"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { debounce } from "@/lib/debounce";

const AUTOSAVE_DELAY_MS = 800;

// General-purpose multi-paragraph rich text field (bold/italic/link) — for
// prose like the about-me bio. Distinct from block-editor/rich-text-block,
// which is deliberately single-paragraph for block-model editing.
export function RichTextEditor({
  initialHtml,
  placeholder,
  onSave,
}: {
  initialHtml: string;
  placeholder: string;
  onSave: (html: string) => void;
}) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const debouncedSave = useMemo(() => debounce(onSave, AUTOSAVE_DELAY_MS), [onSave]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        code: false,
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml || "<p></p>",
    editorProps: {
      attributes: { class: "min-h-32 font-sans text-ink focus:outline-none" },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getHTML());
    },
    onBlur: () => {
      debouncedSave.flush();
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    const flush = () => debouncedSave.flush();
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      window.removeEventListener("beforeunload", flush);
    };
  }, [debouncedSave]);

  if (!editor) return null;

  return (
    <div className="rounded border border-border bg-paper px-3 py-2">
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        {showLinkInput ? (
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (linkUrl) editor.chain().focus().setLink({ href: linkUrl }).run();
                setShowLinkInput(false);
                setLinkUrl("");
              } else if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            placeholder="https://…"
            className="rounded border border-border bg-paper px-2 py-1 text-sm text-ink"
          />
        ) : (
          <div className="flex items-center gap-1 rounded border border-border bg-paper-raised px-1 py-1 shadow-sm">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="Bold"
              aria-pressed={editor.isActive("bold")}
              className={`px-2 py-0.5 font-bold text-ink ${editor.isActive("bold") ? "bg-paper" : ""}`}
            >
              B
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Italic"
              aria-pressed={editor.isActive("italic")}
              className={`px-2 py-0.5 italic text-ink ${editor.isActive("italic") ? "bg-paper" : ""}`}
            >
              I
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setLinkUrl(editor.getAttributes("link").href ?? "");
                setShowLinkInput(true);
              }}
              aria-label="Link"
              aria-pressed={editor.isActive("link")}
              className={`px-2 py-0.5 text-ink underline ${editor.isActive("link") ? "bg-paper" : ""}`}
            >
              Link
            </button>
          </div>
        )}
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}
