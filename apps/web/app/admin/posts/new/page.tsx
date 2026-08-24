import { PostForm } from "../post-form";
import { createPostAction } from "../actions";

export default function NewPostPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-serif text-3xl text-ink">New post</h1>
      <PostForm action={createPostAction} submitLabel="Create" />
    </main>
  );
}
