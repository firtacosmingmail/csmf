import type { Metadata } from "next";
import { getAboutMe } from "@/lib/api/about-me";
import { LegalPage } from "@/components/legal-page";

const LAST_UPDATED = "August 25, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What this site collects and how it's used.",
};

export default async function PrivacyPage() {
  const aboutMe = await getAboutMe();

  return (
    <LegalPage title="Privacy Policy" updated={LAST_UPDATED}>
      <p>This page explains what information this site collects and what happens to it.</p>

      <h2>What&apos;s collected</h2>
      <p>There are two ways this site collects personal information, both of which you provide directly:</p>
      <ul>
        <li>
          <strong>Comments</strong> — your name, an optional email address, and the comment text.
        </li>
        <li>
          <strong>Newsletter signup</strong> — your email address, if you choose to subscribe.
        </li>
      </ul>

      <h2>How it&apos;s used</h2>
      <p>
        Once a comment is approved, your name and comment text are shown publicly on the post; your email address
        (if given) is never displayed publicly and is only used to identify you if there&apos;s a reason to follow
        up about your comment. Comments are moderated — nothing is public until approved.
      </p>
      <p>
        A newsletter email address is used solely to let you know when a new post is published. Every notification
        includes a way to unsubscribe, and unsubscribing removes your address immediately.
      </p>

      <h2>Where it&apos;s stored</h2>
      <p>Comments and subscriptions are stored in this site&apos;s Supabase-hosted database.</p>

      <h2>Third parties</h2>
      <p>
        Your information isn&apos;t sold or shared with advertisers. It&apos;s only ever handled by the
        infrastructure providers needed to run the site itself (hosting, database, and — for newsletter
        notifications — an email-delivery provider).
      </p>

      <h2>Cookies &amp; analytics</h2>
      <p>
        As of the date at the top of this page, this site doesn&apos;t use tracking or advertising cookies, or any
        analytics that identify individual visitors. If that changes, this policy will be updated.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask for a comment or newsletter subscription tied to your email to be deleted at any time — just
        get in touch.
      </p>

      <h2>Changes</h2>
      <p>This policy may be updated from time to time; the date at the top reflects the last change.</p>

      <h2>Contact</h2>
      <p>
        Questions about this policy, or a data request?{" "}
        {aboutMe?.contact_email ? (
          <a href={`mailto:${aboutMe.contact_email}`}>{aboutMe.contact_email}</a>
        ) : (
          "Reach out via the contact details on the About page."
        )}
      </p>
    </LegalPage>
  );
}
