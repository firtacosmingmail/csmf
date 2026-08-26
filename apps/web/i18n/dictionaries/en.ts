export const dictionary = {
  nav: {
    home: "Home",
    about: "About",
  },
  footer: {
    termsOfUse: "Terms of Use",
    privacyPolicy: "Privacy Policy",
    codeOfConduct: "Code of Conduct",
    newsletterIntro: "Get an email when I publish something new.",
  },
  pagination: {
    newer: "← Newer",
    older: "Older →",
    pageOf: (page: number, totalPages: number) => `Page ${page} of ${totalPages}`,
  },
  home: {
    pinned: "Pinned",
    recentPosts: "Recent posts",
    noPosts: "No posts yet.",
  },
  about: {
    title: "About",
    experience: "Experience",
    present: "Present",
  },
  blog: {
    minRead: (n: number) => `${n} min read`,
    comments: "Comments",
  },
  comments: {
    noneYet: "No comments yet.",
    name: "Name",
    emailOptional: "Email (optional)",
    comment: "Comment",
    submit: "Submit comment",
    submitting: "Submitting…",
    thanksPending: "Thanks! Your comment is awaiting approval.",
    errorFallback: "Failed to submit comment",
  },
  newsletter: {
    intro: "Get an email when I publish something new.",
    emailLabel: "Email",
    placeholder: "you@example.com",
    subscribe: "Subscribe",
    subscribing: "Subscribing…",
    thanks: "Thanks — you're subscribed.",
    errorFallback: "Failed to subscribe",
  },
  legal: {
    lastUpdated: (date: string) => `Last updated ${date}`,
  },
  languageSwitcher: {
    en: "English",
    ro: "Română",
  },
};
