import type { Metadata } from "next";
import { getAboutMe } from "@/lib/api/about-me";
import { LegalPage } from "@/components/legal-page";

const LAST_UPDATED = "August 25, 2026";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for csmf.ro.",
};

export default async function TermsPage() {
  const aboutMe = await getAboutMe();

  return (
    <LegalPage title="Terms of Use" updated={LAST_UPDATED}>
      <p>
        This is a personal blog. By reading it, leaving a comment, or subscribing to the newsletter, you agree to
        the terms below.
      </p>

      <h2>Comments</h2>
      <p>
        You&apos;re welcome to leave comments on posts. Comments are moderated — they&apos;re not visible publicly
        until approved, and may be rejected or removed at any time, for any reason, without notice (see the{" "}
        <a href="/code-of-conduct">Code of Conduct</a> for what&apos;s expected). You retain ownership of anything
        you write, but by submitting a comment you grant this site a license to display it publicly once approved.
      </p>
      <p>Don&apos;t post anything illegal, abusive, spammy, or that infringes someone else&apos;s rights.</p>

      <h2>Content ownership</h2>
      <p>
        Posts and other content on this site belong to the site owner unless stated otherwise. Feel free to link to
        or quote from posts (with attribution); don&apos;t republish full posts elsewhere without permission.
      </p>

      <h2>No warranty</h2>
      <p>
        This site is provided as-is, with no guarantee of uptime, accuracy, or fitness for any particular purpose.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may be updated from time to time; the date at the top of this page reflects the last change.
        Continuing to use the site after a change means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms?{" "}
        {aboutMe?.contact_email ? (
          <a href={`mailto:${aboutMe.contact_email}`}>{aboutMe.contact_email}</a>
        ) : (
          "Reach out via the contact details on the About page."
        )}
      </p>
    </LegalPage>
  );
}
