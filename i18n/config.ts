export const locales = ["en", "pt-BR", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "soundpassport_locale";

export const localeLabels: Record<Locale, string> = {
  en: "🇺🇸 English",
  "pt-BR": "🇧🇷 Português",
  es: "🇪🇸 Español",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function matchLocale(languageTag: string): Locale | undefined {
  const normalized = languageTag.trim().toLowerCase();

  if (normalized === "pt-br" || normalized.startsWith("pt-")) {
    return "pt-BR";
  }

  if (normalized === "pt") {
    return "pt-BR";
  }

  if (normalized === "es" || normalized.startsWith("es-")) {
    return "es";
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }

  return undefined;
}
