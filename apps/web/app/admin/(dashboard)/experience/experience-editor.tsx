"use client";

import { useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { normalizeOrder } from "@/lib/block-order";
import { ExperienceRow } from "./experience-row";
import { createExperienceAction, updateExperienceAction, deleteExperienceAction } from "./actions";
import type { WorkExperience } from "@/lib/api/work-experience";
import { locales, type Locale } from "@/i18n/locales";
import { Spinner } from "@/components/spinner";

const LOCALE_LABEL: Record<Locale, string> = { en: "English", ro: "Română" };
const OTHER_LOCALE: Record<Locale, Locale> = { en: "ro", ro: "en" };

function groupByLocale(items: WorkExperience[]): Record<Locale, WorkExperience[]> {
  const grouped = Object.fromEntries(locales.map((l) => [l, [] as WorkExperience[]])) as Record<
    Locale,
    WorkExperience[]
  >;
  for (const item of items) {
    const locale = locales.includes(item.locale as Locale) ? (item.locale as Locale) : "en";
    grouped[locale].push(item);
  }
  return grouped;
}

function withNormalizedOrder(list: WorkExperience[]): WorkExperience[] {
  const normalized = normalizeOrder(list);
  return list.map((item, i) => ({ ...item, display_order: normalized[i].display_order }));
}

export function ExperienceEditor({ initialExperience }: { initialExperience: WorkExperience[] }) {
  const [byLocale, setByLocale] = useState(groupByLocale(initialExperience));
  const [activeLocale, setActiveLocale] = useState<Locale>("en");
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

  function withPending(id: string, setIds: (fn: (prev: Set<string>) => Set<string>) => void, pending: boolean) {
    setIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const items = byLocale[activeLocale];
  function setItems(next: WorkExperience[]) {
    setByLocale((prev) => ({ ...prev, [activeLocale]: next }));
  }

  // Imperative onClick/onBlur calls, not <form action>, so errors here
  // wouldn't otherwise reach the nearest error.tsx boundary.
  async function guarded(fn: () => Promise<void>) {
    try {
      setError(null);
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  // Persists the new positions for whichever items moved, and updates
  // local state to match — mirrors BlockEditor's persistOrder. Ordering is
  // scoped to the active locale's own list.
  async function persistOrder(newList: WorkExperience[], previousList: WorkExperience[]) {
    const normalized = withNormalizedOrder(newList);
    setItems(normalized);
    await Promise.all(
      normalized
        .filter((item) => previousList.find((p) => p.id === item.id)?.display_order !== item.display_order)
        .map((item) => updateExperienceAction(item.id, { display_order: item.display_order })),
    );
  }

  function handleAdd() {
    if (!newCompany.trim() || !newRole.trim()) return;
    setAddingItem(true);
    void guarded(async () => {
      const item = await createExperienceAction({
        company: newCompany,
        role: newRole,
        display_order: items.length,
        locale: activeLocale,
      });
      setItems([...items, item]);
      setNewCompany("");
      setNewRole("");
    }).finally(() => setAddingItem(false));
  }

  function handleUpdate(id: string, patch: Record<string, unknown>) {
    withPending(id, setSavingIds, true);
    void guarded(async () => {
      const updated = await updateExperienceAction(id, patch);
      setItems(items.map((i) => (i.id === id ? updated : i)));
    }).finally(() => withPending(id, setSavingIds, false));
  }

  function handleDelete(id: string) {
    withPending(id, setDeletingIds, true);
    void guarded(async () => {
      await deleteExperienceAction(id);
      await persistOrder(
        items.filter((i) => i.id !== id),
        items,
      );
    }).finally(() => withPending(id, setDeletingIds, false));
  }

  function handleTranslate(item: WorkExperience) {
    const targetLocale = OTHER_LOCALE[activeLocale];
    withPending(item.id, setTranslatingIds, true);
    void guarded(async () => {
      const translated = await createExperienceAction({
        company: item.company,
        role: item.role,
        description: item.description ?? undefined,
        start_date: item.start_date,
        end_date: item.end_date,
        display_order: byLocale[targetLocale].length,
        locale: targetLocale,
        translation_group_id: item.translation_group_id,
      });
      setByLocale((prev) => ({ ...prev, [targetLocale]: [...prev[targetLocale], translated] }));
    }).finally(() => withPending(item.id, setTranslatingIds, false));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    void guarded(() => persistOrder(arrayMove(items, oldIndex, newIndex), items));
  }

  const translatedGroupIds = new Set(byLocale[OTHER_LOCALE[activeLocale]].map((i) => i.translation_group_id));

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded border border-terracotta bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="shrink-0">
            ×
          </button>
        </div>
      )}

      <div className="flex gap-2 border-b border-border">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActiveLocale(locale)}
            className={`px-3 py-2 text-sm ${
              locale === activeLocale ? "border-b-2 border-terracotta text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {LOCALE_LABEL[locale]}
          </button>
        ))}
      </div>

      {items.length === 0 && <p className="text-sm text-ink-muted">No experience yet — add your first entry below.</p>}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const translating = translatingIds.has(item.id);
              return (
                <div key={item.id} className="flex flex-col gap-1">
                  <ExperienceRow
                    item={item}
                    onUpdate={(patch) => handleUpdate(item.id, patch)}
                    onDelete={() => handleDelete(item.id)}
                    saving={savingIds.has(item.id)}
                    deleting={deletingIds.has(item.id)}
                  />
                  {!translatedGroupIds.has(item.translation_group_id) && (
                    <button
                      type="button"
                      disabled={translating}
                      onClick={() => handleTranslate(item)}
                      className="flex items-center gap-1.5 self-start text-xs text-terracotta hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
                    >
                      {translating && <Spinner className="h-3 w-3" />}
                      + Add {LOCALE_LABEL[OTHER_LOCALE[activeLocale]]} translation
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-2 rounded border border-dashed border-border p-3">
        <input
          value={newCompany}
          onChange={(e) => setNewCompany(e.target.value)}
          placeholder="Company"
          aria-label="New company"
          disabled={addingItem}
          className="flex-1 rounded border border-border bg-paper px-2 py-1 text-sm text-ink"
        />
        <input
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          placeholder="Role"
          aria-label="New role"
          disabled={addingItem}
          className="flex-1 rounded border border-border bg-paper px-2 py-1 text-sm text-ink"
        />
        <button
          type="button"
          disabled={addingItem}
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-terracotta hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
        >
          {addingItem && <Spinner className="h-3.5 w-3.5" />}
          + Add
        </button>
      </div>
    </div>
  );
}
