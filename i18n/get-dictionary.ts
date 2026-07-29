import "server-only";

import type { Locale } from "@/i18n/config";

const dictionaries = {
  en: () => import("@/i18n/dictionaries/en.json").then((module) => module.default),
  "pt-BR": () =>
    import("@/i18n/dictionaries/pt-BR.json").then((module) => module.default),
  es: () => import("@/i18n/dictionaries/es.json").then((module) => module.default),
};

export type Dictionary = Awaited<
  ReturnType<(typeof dictionaries)[keyof typeof dictionaries]>
>;

export function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
