import { getWorkExperience } from "@/lib/api/work-experience";
import { ExperienceEditor } from "./experience-editor";

export default async function AdminExperiencePage() {
  const experience = await getWorkExperience();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-serif text-3xl text-ink">Work experience</h1>
      <ExperienceEditor initialExperience={experience} />
    </main>
  );
}
