import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterForm } from "./newsletter-form";
import { subscribeToNewsletterAction } from "@/app/newsletter-actions";

vi.mock("@/app/newsletter-actions", () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

describe("NewsletterForm", () => {
  beforeEach(() => {
    vi.mocked(subscribeToNewsletterAction).mockReset();
  });

  it("submits the email and shows a thanks message on success", async () => {
    const user = userEvent.setup();
    vi.mocked(subscribeToNewsletterAction).mockResolvedValue(undefined);

    render(<NewsletterForm />);

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    await waitFor(() => {
      expect(subscribeToNewsletterAction).toHaveBeenCalledWith("jane@example.com");
    });
    expect(await screen.findByText("Thanks — you're subscribed.")).toBeInTheDocument();
  });

  it("shows an error message and keeps the form visible when subscribing fails", async () => {
    const user = userEvent.setup();
    vi.mocked(subscribeToNewsletterAction).mockRejectedValue(new Error("email must be a valid email"));

    render(<NewsletterForm />);

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(await screen.findByText("email must be a valid email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});
