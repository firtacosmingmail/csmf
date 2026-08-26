import { assertEquals } from "jsr:@std/assert@1";
import { validateWorkExperienceInput, validateWorkExperienceUpdate } from "./work-experience.ts";

Deno.test("validateWorkExperienceInput accepts company/role only", () => {
  const result = validateWorkExperienceInput({ company: "Acme", role: "Engineer" });
  assertEquals(result, { success: true, data: { company: "Acme", role: "Engineer" } });
});

Deno.test("validateWorkExperienceInput accepts a null end_date (ongoing role)", () => {
  const result = validateWorkExperienceInput({
    company: "Acme",
    role: "Engineer",
    start_date: "2020-01-15",
    end_date: null,
  });
  assertEquals(result.success, true);
});

Deno.test("validateWorkExperienceInput rejects a missing company", () => {
  const result = validateWorkExperienceInput({ role: "Engineer" });
  assertEquals(result.success, false);
});

Deno.test("validateWorkExperienceInput rejects a malformed date", () => {
  const result = validateWorkExperienceInput({ company: "Acme", role: "Engineer", start_date: "Jan 2020" });
  assertEquals(result.success, false);
});

Deno.test("validateWorkExperienceUpdate accepts a partial update", () => {
  const result = validateWorkExperienceUpdate({ display_order: 3 });
  assertEquals(result, { success: true, data: { display_order: 3 } });
});

Deno.test("validateWorkExperienceUpdate rejects unknown fields", () => {
  const result = validateWorkExperienceUpdate({ location: "Remote" });
  assertEquals(result.success, false);
});

Deno.test("validateWorkExperienceInput accepts a locale and translation_group_id", () => {
  const result = validateWorkExperienceInput({
    company: "Acme",
    role: "Engineer",
    locale: "ro",
    translation_group_id: "550e8400-e29b-41d4-a716-446655440000",
  });
  assertEquals(result.success, true);
});

Deno.test("validateWorkExperienceInput rejects an unsupported locale", () => {
  const result = validateWorkExperienceInput({ company: "Acme", role: "Engineer", locale: "fr" });
  assertEquals(result.success, false);
});
