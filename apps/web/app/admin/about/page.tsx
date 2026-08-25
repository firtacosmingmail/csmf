import { getAboutMe } from "@/lib/api/about-me";
import { getSocialLinks } from "@/lib/api/social-links";
import { AboutForm } from "./about-form";

export default async function AdminAboutPage() {
  const [aboutMe, socialLinks] = await Promise.all([getAboutMe(), getSocialLinks()]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-serif text-3xl text-ink">About me</h1>
      <AboutForm initialAboutMe={aboutMe} initialSocialLinks={socialLinks} />
    </main>
  );
}
