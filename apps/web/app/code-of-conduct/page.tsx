import type { Metadata } from "next";
import { getAboutMe } from "@/lib/api/about-me";
import { LegalPage } from "@/components/legal-page";

const LAST_UPDATED = "August 25, 2026";

export const metadata: Metadata = {
  title: "Code of Conduct",
  description: "What's expected when commenting on this site.",
};

export default async function CodeOfConductPage() {
  const aboutMe = await getAboutMe();

  return (
    <LegalPage title="Code of Conduct" updated={LAST_UPDATED}>
      <p>This applies to comments left on blog posts here. It&apos;s short, because it doesn&apos;t need to be long.</p>

      <h2>Be respectful</h2>
      <p>
        Disagreement is fine; personal attacks, harassment, and hate speech aren&apos;t. Comment on ideas, not
        people.
      </p>

      <h2>Stay on topic</h2>
      <p>No spam, no advertising, no off-topic link-dropping.</p>

      <h2>Nothing illegal</h2>
      <p>Don&apos;t post content that&apos;s illegal or infringes someone else&apos;s rights.</p>

      <h2>What happens if you don&apos;t</h2>
      <p>
        Comments that don&apos;t meet this bar won&apos;t be approved for publication, and previously approved
        comments may be removed later if they&apos;re found to violate it. That&apos;s a moderation decision, not a
        debate.
      </p>

      <h2>Contact</h2>
      <p>
        See something that concerns you?{" "}
        {aboutMe?.contact_email ? (
          <a href={`mailto:${aboutMe.contact_email}`}>{aboutMe.contact_email}</a>
        ) : (
          "Reach out via the contact details on the About page."
        )}
      </p>
    </LegalPage>
  );
}
