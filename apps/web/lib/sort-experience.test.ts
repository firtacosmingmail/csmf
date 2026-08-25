import { describe, expect, it } from "vitest";
import { sortByStartDateDesc } from "./sort-experience";

describe("sortByStartDateDesc", () => {
  it("orders most recent start_date first", () => {
    const items = [
      { id: "a", start_date: "2020-01-01" },
      { id: "b", start_date: "2023-06-15" },
      { id: "c", start_date: "2021-03-10" },
    ];
    expect(sortByStartDateDesc(items).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts entries with no start_date last", () => {
    const items = [
      { id: "a", start_date: null },
      { id: "b", start_date: "2023-06-15" },
    ];
    expect(sortByStartDateDesc(items).map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("does not mutate the input array", () => {
    const items = [
      { id: "a", start_date: "2020-01-01" },
      { id: "b", start_date: "2023-06-15" },
    ];
    const original = [...items];
    sortByStartDateDesc(items);
    expect(items).toEqual(original);
  });
});
