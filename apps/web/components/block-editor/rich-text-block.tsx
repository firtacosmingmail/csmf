"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { debounce } from "@/lib/debounce";
import { stripParagraphWrapper, wrapInParagraph } from "@/lib/block-html";

const AUTOSAVE_DELAY_MS = 800;

// A single-block, single-line rich text field: bold/italic/inline-code/link
// only, backed by a one-paragraph Tiptap document (block.content.text
// stores just the inline HTML — see lib/block-html.ts for why). Enter is
// suppressed so a block never grows a second paragraph; use the +/slash
// menu to add another block instead.
export function RichTextBlock({
  initialText,
  placeholder,
  className,
  onSave,
}: {
  initialText: string;
  placeholder: string;
  className: string;
  onSave: (text: string) => void;
}) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // Recreating this when `onSave` changes identity is safe: the parent
  // only passes a new `onSave` right after a debounced save just resolved
  // (see BlockEditor's setBlocks-on-success), so there's never a pending
  // timer left stranded in the old instance.
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
        hardBreak: false,
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: wrapInParagraph(initialText),
    editorProps: {
      attributes: { class: className },
      // Blocks are single-paragraph documents — Enter would otherwise
      // split into a second paragraph node.
      handleKeyDown: (_view, event) => event.key === "Enter",
    },
    onUpdate: ({ editor }) => {
      debouncedSave(stripParagraphWrapper(editor.getHTML()));
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
    <>
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
              onClick={() => editor.chain().focus().toggleCode().run()}
              aria-label="Inline code"
              aria-pressed={editor.isActive("code")}
              className={`px-2 py-0.5 font-mono text-sm text-ink ${editor.isActive("code") ? "bg-paper" : ""}`}
            >
              {"</>"}
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
    </>
  );
}
