import { apiFetch } from "./client";

export async function subscribeToNewsletter(email: string): Promise<void> {
  const res = await apiFetch("/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to subscribe: ${res.status}`);
  }
}
