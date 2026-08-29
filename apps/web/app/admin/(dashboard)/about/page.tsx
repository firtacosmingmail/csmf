import { createClient } from "@/lib/supabase/server";
import { getAllAboutMe } from "@/lib/api/about-me";
import { getSocialLinks } from "@/lib/api/social-links";
import { AboutForm } from "./about-form";

export default async function AdminAboutPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [aboutMe, socialLinks] = await Promise.all([
    getAllAboutMe(session?.access_token),
    getSocialLinks(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-serif text-3xl text-ink">About me</h1>
      <AboutForm initialAboutMeByLocale={aboutMe} initialSocialLinks={socialLinks} />
    </main>
  );
}
