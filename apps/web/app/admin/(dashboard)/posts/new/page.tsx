import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/lib/api/posts";
import { isLocale, type Locale } from "@/i18n/locales";
import { PostForm } from "../post-form";
import { createPostAction } from "../actions";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ translationOf?: string; locale?: string }>;
}) {
  const { translationOf, locale } = await searchParams;

  if (!translationOf) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
        <h1 className="font-serif text-3xl text-ink">New post</h1>
        <PostForm action={createPostAction} submitLabel="Create" translation={{}} />
      </main>
    );
  }

  if (!locale || !isLocale(locale)) notFound();
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const source = await getPostById(translationOf, session?.access_token);
  if (!source) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-serif text-3xl text-ink">Translate &ldquo;{source.title}&rdquo;</h1>
      <PostForm
        action={createPostAction}
        submitLabel="Create"
        translation={{ locale: locale as Locale, groupId: source.translation_group_id }}
      />
    </main>
  );
}
