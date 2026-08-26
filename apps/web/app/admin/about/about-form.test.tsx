import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AboutForm } from "./about-form";
import {
  updateAboutMeAction,
  uploadAvatarAction,
  createSocialLinkAction,
  updateSocialLinkAction,
  deleteSocialLinkAction,
} from "./actions";
import type { SocialLink } from "@/lib/api/social-links";

// RichTextEditor wraps Tiptap/ProseMirror, which needs real browser APIs
// jsdom doesn't fully provide — stand in with a plain textarea so this
// file can test AboutForm's own wiring instead.
vi.mock("@/components/rich-text-editor", () => ({
  RichTextEditor: ({ initialHtml, onSave }: { initialHtml: string; onSave: (html: string) => void }) => (
    <textarea aria-label="bio" defaultValue={initialHtml} onChange={(e) => onSave(e.target.value)} />
  ),
}));

vi.mock("./actions", () => ({
  updateAboutMeAction: vi.fn(),
  uploadAvatarAction: vi.fn(),
  createSocialLinkAction: vi.fn(),
  updateSocialLinkAction: vi.fn(),
  deleteSocialLinkAction: vi.fn(),
}));

function makeLink(overrides: Partial<SocialLink>): SocialLink {
  return {
    id: "link-1",
    platform: "GitHub",
    url: "https://github.com/me",
    display_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("AboutForm", () => {
  beforeEach(() => {
    vi.mocked(updateAboutMeAction).mockReset();
    vi.mocked(uploadAvatarAction).mockReset();
    vi.mocked(createSocialLinkAction).mockReset();
    vi.mocked(updateSocialLinkAction).mockReset();
    vi.mocked(deleteSocialLinkAction).mockReset();
  });

  it("saves the headline for the active (default English) locale on blur", async () => {
    const user = userEvent.setup();
    render(<AboutForm initialAboutMeByLocale={[]} initialSocialLinks={[]} />);

    const headline = screen.getByLabelText("Headline");
    await user.type(headline, "Hi there");
    await user.tab();

    await waitFor(() => {
      expect(updateAboutMeAction).toHaveBeenCalledWith({ locale: "en", headline: "Hi there" });
    });
  });

  it("switches tabs to edit the Romanian row independently", async () => {
    const user = userEvent.setup();
    render(
      <AboutForm
        initialAboutMeByLocale={[
          {
            locale: "en",
            headline: "Hi",
            bio: null,
            avatar_url: null,
            contact_email: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
          {
            locale: "ro",
            headline: "Salut",
            bio: null,
            avatar_url: null,
            contact_email: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        ]}
        initialSocialLinks={[]}
      />,
    );

    expect(screen.getByLabelText("Headline")).toHaveValue("Hi");

    await user.click(screen.getByText("Română"));
    expect(screen.getByLabelText("Headline")).toHaveValue("Salut");

    await user.clear(screen.getByLabelText("Headline"));
    await user.type(screen.getByLabelText("Headline"), "Salut nou");
    await user.tab();

    await waitFor(() => {
      expect(updateAboutMeAction).toHaveBeenCalledWith({ locale: "ro", headline: "Salut nou" });
    });
  });

  it("adds a social link only once both fields are filled, then clears the inputs", async () => {
    const user = userEvent.setup();
    vi.mocked(createSocialLinkAction).mockResolvedValue(makeLink({ id: "new-link" }));

    render(<AboutForm initialAboutMeByLocale={[]} initialSocialLinks={[]} />);

    await user.click(screen.getByText("Add"));
    expect(createSocialLinkAction).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("New platform"), "GitHub");
    await user.type(screen.getByLabelText("New URL"), "https://github.com/me");
    await user.click(screen.getByText("Add"));

    await waitFor(() => {
      expect(createSocialLinkAction).toHaveBeenCalledWith({
        platform: "GitHub",
        url: "https://github.com/me",
        display_order: 0,
      });
    });
    expect(await screen.findByDisplayValue("https://github.com/me")).toBeInTheDocument();
    expect(screen.getByLabelText("New platform")).toHaveValue("");
  });

  it("removing a social link calls deleteSocialLinkAction and removes the row", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteSocialLinkAction).mockResolvedValue(undefined);

    render(<AboutForm initialAboutMeByLocale={[]} initialSocialLinks={[makeLink({})]} />);

    await user.click(screen.getByText("Remove"));

    await waitFor(() => {
      expect(deleteSocialLinkAction).toHaveBeenCalledWith("link-1");
    });
    expect(screen.queryByDisplayValue("https://github.com/me")).not.toBeInTheDocument();
  });

  it("uploads an avatar and saves the resulting url", async () => {
    vi.mocked(uploadAvatarAction).mockResolvedValue({ url: "https://example.com/avatar.png", width: 1, height: 1 });

    render(<AboutForm initialAboutMeByLocale={[]} initialSocialLinks={[]} />);

    const file = new File(["fake"], "avatar.png", { type: "image/png" });
    const user = userEvent.setup();
    await user.upload(screen.getByLabelText("Upload avatar"), file);

    await waitFor(() => {
      expect(uploadAvatarAction).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(updateAboutMeAction).toHaveBeenCalledWith({ locale: "en", avatar_url: "https://example.com/avatar.png" });
    });
  });

  it("shows a dismissible error banner when saving the headline fails", async () => {
    const user = userEvent.setup();
    vi.mocked(updateAboutMeAction).mockRejectedValueOnce(new Error("network blip"));

    render(<AboutForm initialAboutMeByLocale={[]} initialSocialLinks={[]} />);

    await user.type(screen.getByLabelText("Headline"), "Hi");
    await user.tab();

    expect(await screen.findByText("network blip")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Dismiss error"));
    expect(screen.queryByText("network blip")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no social links", () => {
    render(<AboutForm initialAboutMeByLocale={[]} initialSocialLinks={[]} />);
    expect(screen.getByText("No social links yet.")).toBeInTheDocument();
  });
});
