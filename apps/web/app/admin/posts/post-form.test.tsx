import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostForm } from "./post-form";

describe("PostForm", () => {
  it("auto-fills the slug from the title until the slug is edited directly", async () => {
    const user = userEvent.setup();
    render(<PostForm action={vi.fn()} submitLabel="Create" />);

    const title = screen.getByLabelText("Title");
    const slug = screen.getByLabelText("Slug");

    await user.type(title, "Hello, World");
    expect(slug).toHaveValue("hello-world");

    // Once the user edits the slug directly, further title edits stop
    // overwriting it.
    await user.clear(slug);
    await user.type(slug, "custom-slug");
    await user.type(title, "!");
    expect(slug).toHaveValue("custom-slug");
  });

  it("prefills fields from defaultValues and treats an existing slug as already touched", () => {
    render(
      <PostForm
        action={vi.fn()}
        submitLabel="Save"
        defaultValues={{
          title: "Existing post",
          subtitle: "A subtitle",
          slug: "existing-post",
          status: "published",
          pinned: true,
        }}
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Existing post");
    expect(screen.getByLabelText("Slug")).toHaveValue("existing-post");
    expect(screen.getByLabelText("Subtitle")).toHaveValue("A subtitle");
    expect(screen.getByLabelText("Pinned")).toBeChecked();
  });
});
