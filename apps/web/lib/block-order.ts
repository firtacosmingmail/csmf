// Recomputes sequential display_order values (0, 1, 2, …) from a block
// list's current array order — used after a drag-and-drop reorder, before
// persisting the new positions via PATCH /blocks/:id.
export function normalizeOrder<T extends { id: string }>(
  blocks: readonly T[],
): { id: string; display_order: number }[] {
  return blocks.map((block, index) => ({ id: block.id, display_order: index }));
}
