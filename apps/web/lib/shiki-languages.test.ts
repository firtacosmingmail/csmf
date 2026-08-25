import { describe, expect, it, vi } from "vitest";

vi.mock("shiki", () => ({
  bundledLanguagesInfo: [
    { id: "python", name: "Python", aliases: ["py"] },
    { id: "abap", name: "ABAP" },
    { id: "typescript", name: "TypeScript", aliases: ["ts"] },
  ],
}));

const { CODE_LANGUAGES } = await import("./shiki-languages");

describe("CODE_LANGUAGES", () => {
  it("sorts languages by display name", () => {
    expect(CODE_LANGUAGES.map((l) => l.name)).toEqual(["ABAP", "Python", "TypeScript"]);
  });

  it("keeps only id and name, dropping aliases", () => {
    expect(CODE_LANGUAGES).toEqual([
      { id: "abap", name: "ABAP" },
      { id: "python", name: "Python" },
      { id: "typescript", name: "TypeScript" },
    ]);
  });
});
