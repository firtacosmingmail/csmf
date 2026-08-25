import { describe, expect, it } from "vitest";
import { normalizeOrder } from "./block-order";

describe("normalizeOrder", () => {
  it("assigns sequential display_order values matching array position", () => {
    const blocks = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(normalizeOrder(blocks)).toEqual([
      { id: "a", display_order: 0 },
      { id: "b", display_order: 1 },
      { id: "c", display_order: 2 },
    ]);
  });

  it("reflects a reordered array, not the blocks' prior positions", () => {
    const blocks = [{ id: "c" }, { id: "a" }, { id: "b" }];
    expect(normalizeOrder(blocks)).toEqual([
      { id: "c", display_order: 0 },
      { id: "a", display_order: 1 },
      { id: "b", display_order: 2 },
    ]);
  });

  it("returns an empty array for an empty input", () => {
    expect(normalizeOrder([])).toEqual([]);
  });
});
