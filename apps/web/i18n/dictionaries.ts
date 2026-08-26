import type { Locale } from "./locales";

const dictionaries = {
  en: () => import("./dictionaries/en").then((m) => m.dictionary),
  ro: () => import("./dictionaries/ro").then((m) => m.dictionary),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

export const getDictionary = (locale: Locale): Promise<Dictionary> => dictionaries[locale]();
