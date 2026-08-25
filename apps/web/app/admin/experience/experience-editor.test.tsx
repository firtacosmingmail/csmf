import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExperienceEditor } from "./experience-editor";
import { createExperienceAction, updateExperienceAction, deleteExperienceAction } from "./actions";
import type { WorkExperience } from "@/lib/api/work-experience";

vi.mock("./actions", () => ({
  createExperienceAction: vi.fn(),
  updateExperienceAction: vi.fn(),
  deleteExperienceAction: vi.fn(),
}));

function makeItem(overrides: Partial<WorkExperience>): WorkExperience {
  return {
    id: "exp-1",
    company: "Acme",
    role: "Engineer",
    description: null,
    start_date: "2020-01-01",
    end_date: null,
    display_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("ExperienceEditor", () => {
  beforeEach(() => {
    vi.mocked(createExperienceAction).mockReset();
    vi.mocked(updateExperienceAction).mockReset();
    vi.mocked(deleteExperienceAction).mockReset();
    vi.mocked(updateExperienceAction).mockImplementation(async (id, patch) =>
      makeItem({ id, ...patch } as Partial<WorkExperience>),
    );
  });

  it("adds an entry only once both company and role are filled", async () => {
    const user = userEvent.setup();
    vi.mocked(createExperienceAction).mockResolvedValue(makeItem({ id: "new-exp", company: "Globex", role: "Lead" }));

    render(<ExperienceEditor initialExperience={[]} />);

    await user.click(screen.getByText("+ Add"));
    expect(createExperienceAction).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("New company"), "Globex");
    await user.type(screen.getByLabelText("New role"), "Lead");
    await user.click(screen.getByText("+ Add"));

    await waitFor(() => {
      expect(createExperienceAction).toHaveBeenCalledWith({ company: "Globex", role: "Lead", display_order: 0 });
    });
    expect(await screen.findByDisplayValue("Globex")).toBeInTheDocument();
  });

  it("editing a field on blur calls updateExperienceAction with just that field", async () => {
    const user = userEvent.setup();
    render(<ExperienceEditor initialExperience={[makeItem({})]} />);

    const companyInput = screen.getByLabelText("Company");
    await user.clear(companyInput);
    await user.type(companyInput, "New Co");
    await user.tab();

    await waitFor(() => {
      expect(updateExperienceAction).toHaveBeenCalledWith("exp-1", { company: "New Co" });
    });
  });

  it("deleting an entry calls deleteExperienceAction and removes it", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteExperienceAction).mockResolvedValue(undefined);

    render(<ExperienceEditor initialExperience={[makeItem({})]} />);

    await user.click(screen.getByLabelText("Delete"));

    await waitFor(() => {
      expect(deleteExperienceAction).toHaveBeenCalledWith("exp-1");
    });
    expect(screen.queryByDisplayValue("Acme")).not.toBeInTheDocument();
  });
});
