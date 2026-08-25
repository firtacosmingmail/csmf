import Link from "next/link";

export function AdminNav() {
  return (
    <Link href="/admin" className="self-start font-sans text-sm text-ink-muted hover:text-ink hover:underline">
      ← Dashboard
    </Link>
  );
}
