"use server";

import { subscribeToNewsletter } from "@/lib/api/newsletter";

// Public — no access token needed. Routed through a server action anyway
// (rather than calling the Edge Function straight from the browser) to
// match this app's one path for talking to the API, and to sidestep CORS.
export async function subscribeToNewsletterAction(email: string): Promise<void> {
  return subscribeToNewsletter(email);
}
