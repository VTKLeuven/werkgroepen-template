import type { Locale } from "@/generated/prisma/client";

export const locales = ["en", "nl"] as const;
export type PublicLocale = (typeof locales)[number];

export function normalizeLocale(
  value: string | string[] | null | undefined,
  fallback: Locale | PublicLocale = "en",
): PublicLocale {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "nl" || candidate === "en" ? candidate : fallback;
}

export function localized(
  locale: PublicLocale,
  english: string | null | undefined,
  dutch: string | null | undefined,
  fallback = "",
) {
  const preferred = locale === "nl" ? dutch : english;
  const secondary = locale === "nl" ? english : dutch;
  return preferred?.trim() || secondary?.trim() || fallback;
}

export const uiText = {
  en: {
    about: "About",
    team: "Team",
    events: "Events",
    contact: "Contact",
    partners: "Partners",
    people: "People",
    agenda: "Agenda",
    upcoming: "Upcoming",
    previous: "Previous",
    nothingYet: "Nothing here yet.",
    backToEvents: "Events",
    managedWith: "managed with the VTK subdivision template",
    addPhoto: "Add your own photo",
    heroFallback: "Make this first impression unmistakably yours.",
  },
  nl: {
    about: "Over",
    team: "Team",
    events: "Events",
    contact: "Contact",
    partners: "Partners",
    people: "Ploeg",
    agenda: "Agenda",
    upcoming: "Aankomend",
    previous: "Voorbije",
    nothingYet: "Nog niets om te tonen.",
    backToEvents: "Events",
    managedWith: "beheerd met de VTK werkgroep-template",
    addPhoto: "Voeg je eigen foto toe",
    heroFallback: "Maak deze eerste indruk helemaal eigen.",
  },
} satisfies Record<PublicLocale, Record<string, string>>;
