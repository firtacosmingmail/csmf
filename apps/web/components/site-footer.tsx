import { getSocialLinks } from "@/lib/api/social-links";

export async function SiteFooter() {
  const socialLinks = await getSocialLinks();

  return (
    <footer className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 py-8 font-sans text-sm text-ink-muted">
      {socialLinks.length > 0 && (
        <div className="flex gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink hover:underline"
            >
              {link.platform}
            </a>
          ))}
        </div>
      )}
      <p>© {new Date().getFullYear()} csmf.ro</p>
    </footer>
  );
}
