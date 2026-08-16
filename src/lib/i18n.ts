import type { LanguageMode, Locale } from "@/generated/prisma/client";

export const locales = ["en", "nl"] as const;
export type PublicLocale = (typeof locales)[number];

export function normalizeLocale(
  value: string | string[] | null | undefined,
  fallback: Locale | PublicLocale = "en",
): PublicLocale {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "nl" || candidate === "en" ? candidate : fallback;
}

export function isMultilingual(
  languageMode: LanguageMode | null | undefined = "bilingual",
) {
  return languageMode === "bilingual";
}

export function languageModeLocale(
  languageMode: LanguageMode | null | undefined,
  fallback: Locale | PublicLocale = "en",
): PublicLocale {
  if (languageMode === "englishOnly") return "en";
  if (languageMode === "dutchOnly") return "nl";
  return fallback;
}

export function resolveLocale(
  value: string | string[] | null | undefined,
  fallback: Locale | PublicLocale = "en",
  languageMode: LanguageMode | null | undefined = "bilingual",
): PublicLocale {
  const configuredLocale = languageModeLocale(languageMode, fallback);

  return isMultilingual(languageMode)
    ? normalizeLocale(value, configuredLocale)
    : configuredLocale;
}

export function localizeHref(
  href: string,
  locale: PublicLocale,
  languageMode: LanguageMode | null | undefined = "bilingual",
) {
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//")) {
    return href;
  }

  const hashIndex = href.indexOf("#");
  const fragment =
    hashIndex >= 0 ? href.slice(hashIndex + 1).split("#", 1)[0] : "";
  const hash = fragment ? `#${fragment}` : "";
  const pathAndQuery = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = pathAndQuery.indexOf("?");
  const path =
    queryIndex >= 0 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery;
  const query = queryIndex >= 0 ? pathAndQuery.slice(queryIndex + 1) : "";
  const searchParams = new URLSearchParams(query);

  if (isMultilingual(languageMode)) {
    searchParams.set("lang", locale);
  } else {
    searchParams.delete("lang");
  }

  const search = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  return `${path || "/"}${search}${hash}`;
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

export function localizedOptional(
  locale: PublicLocale,
  english: string | null | undefined,
  dutch: string | null | undefined,
) {
  return (
    (locale === "nl" ? dutch : english)
      ?.replace(/[\u200B\u2060\uFEFF]/g, "")
      .trim() ?? ""
  );
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
    photos: "Photos",
    albums: "Albums",
    allAlbums: "All albums",
    backToAlbums: "Albums",
    photoCount: "photos",
    singlePhoto: "photo",
    emptyAlbum: "This album has no photos yet.",
    openPhoto: "Open photo",
    closePhoto: "Close",
    previousPhoto: "Previous photo",
    nextPhoto: "Next photo",
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
    photos: "Foto's",
    albums: "Albums",
    allAlbums: "Alle albums",
    backToAlbums: "Albums",
    photoCount: "foto's",
    singlePhoto: "foto",
    emptyAlbum: "Dit album bevat nog geen foto's.",
    openPhoto: "Foto openen",
    closePhoto: "Sluiten",
    previousPhoto: "Vorige foto",
    nextPhoto: "Volgende foto",
  },
} satisfies Record<PublicLocale, Record<string, string>>;
