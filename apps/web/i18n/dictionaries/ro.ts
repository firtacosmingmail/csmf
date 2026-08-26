import type { dictionary as en } from "./en";

export const dictionary: typeof en = {
  nav: {
    home: "Acasă",
    about: "Despre",
  },
  footer: {
    termsOfUse: "Termeni de utilizare",
    privacyPolicy: "Politica de confidențialitate",
    codeOfConduct: "Cod de conduită",
    newsletterIntro: "Primește un email când public ceva nou.",
  },
  pagination: {
    newer: "← Mai noi",
    older: "Mai vechi →",
    pageOf: (page: number, totalPages: number) => `Pagina ${page} din ${totalPages}`,
  },
  home: {
    pinned: "Fixate",
    recentPosts: "Articole recente",
    noPosts: "Niciun articol încă.",
  },
  about: {
    title: "Despre",
    experience: "Experiență",
    present: "Prezent",
  },
  blog: {
    minRead: (n: number) => `${n} min de citit`,
    comments: "Comentarii",
  },
  comments: {
    noneYet: "Niciun comentariu încă.",
    name: "Nume",
    emailOptional: "Email (opțional)",
    comment: "Comentariu",
    submit: "Trimite comentariul",
    submitting: "Se trimite…",
    thanksPending: "Mulțumesc! Comentariul tău așteaptă aprobarea.",
    errorFallback: "Trimiterea comentariului a eșuat",
  },
  newsletter: {
    intro: "Primește un email când public ceva nou.",
    emailLabel: "Email",
    placeholder: "tu@exemplu.com",
    subscribe: "Abonează-te",
    subscribing: "Se abonează…",
    thanks: "Mulțumesc — ești abonat.",
    errorFallback: "Abonarea a eșuat",
  },
  legal: {
    lastUpdated: (date: string) => `Ultima actualizare: ${date}`,
  },
  languageSwitcher: {
    en: "English",
    ro: "Română",
  },
};
