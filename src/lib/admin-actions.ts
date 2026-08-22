"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/format";
import type { HeroTextPosition } from "@/lib/hero-layout";
import { saveUploadedImage } from "@/lib/media";
import { removePhotoFiles } from "@/lib/photos";
import { prisma } from "@/lib/prisma";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableValue(formData: FormData, key: string) {
  const input = value(formData, key);
  return input.length > 0 ? input : null;
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").replace(/\r\n?/g, "\n");
}

function dateValue(formData: FormData, key: string) {
  const input = value(formData, key);
  return input ? new Date(input) : null;
}

type SupportedLocale = "en" | "nl";
type SupportedLanguageMode = "bilingual" | "englishOnly" | "dutchOnly";

function languageModeValue(formData: FormData): SupportedLanguageMode {
  const input = value(formData, "languageMode");
  if (input === "englishOnly" || input === "dutchOnly") return input;
  return "bilingual";
}

function primaryLocale(
  languageMode: SupportedLanguageMode,
  defaultLocale: SupportedLocale,
): SupportedLocale {
  if (languageMode === "englishOnly") return "en";
  if (languageMode === "dutchOnly") return "nl";
  return defaultLocale;
}

function localizedFormValues(
  formData: FormData,
  key: string,
  previous?: { en?: string | null; nl?: string | null },
  preserveWhitespace = false,
) {
  const englishKey = `${key}En`;
  const dutchKey = `${key}Nl`;
  const read = preserveWhitespace ? textValue : value;

  return {
    en: formData.has(englishKey) ? read(formData, englishKey) : previous?.en ?? "",
    nl: formData.has(dutchKey) ? read(formData, dutchKey) : previous?.nl ?? "",
  };
}

function canonical<T>(
  locale: SupportedLocale,
  localizedValue: { en: T; nl: T },
) {
  return locale === "nl" ? localizedValue.nl : localizedValue.en;
}

function clampedFloat(
  formData: FormData,
  key: string,
  fallback: number,
  minimum = 0.8,
  maximum = 1.3,
) {
  const input = Number.parseFloat(value(formData, key));
  if (!Number.isFinite(input)) return fallback;
  return Math.min(maximum, Math.max(minimum, input));
}

function colorValue(formData: FormData, key: string, fallback: string) {
  const input = value(formData, key);
  return /^#[0-9a-f]{6}$/i.test(input) ? input.toLowerCase() : fallback;
}

function heroTextPositionValue(
  formData: FormData,
  fallback: HeroTextPosition = "bottomLeft",
): HeroTextPosition {
  const input = value(formData, "heroTextPosition");
  return input === "topLeft" ||
    input === "topCenter" ||
    input === "topRight" ||
    input === "centerLeft" ||
    input === "center" ||
    input === "centerRight" ||
    input === "bottomLeft" ||
    input === "bottomCenter" ||
    input === "bottomRight"
    ? input
    : fallback;
}

function heroOverlayIntensityValue(
  formData: FormData,
  fallback = 70,
  minimum = 0,
  maximum = 100,
): number {
  if (!formData.has("heroOverlayIntensity")) {
    return fallback;
  }
  const input = Number.parseFloat(value(formData, "heroOverlayIntensity"));
  if (!Number.isFinite(input)) return fallback;
  return Math.min(maximum, Math.max(minimum, input));
}

type CoverDisplayModeValue =
  | "full"
  | "flexible"
  | "fit"
  | "fill"
  | "crop";
type CoverBorderStyleValue = "solid" | "dashed" | "dotted" | "double";
type CoverFrameShadowValue = "none" | "soft" | "strong";
type CoverPlacementValue = "above" | "left" | "right";

function coverDisplayModeValue(
  formData: FormData,
  fallback: CoverDisplayModeValue = "fill",
  key = "coverDisplayMode",
): CoverDisplayModeValue {
  const input = value(formData, key);
  return input === "full" ||
    input === "flexible" ||
    input === "fit" ||
    input === "crop" ||
    input === "fill"
    ? input
    : fallback;
}

function coverBorderStyleValue(
  formData: FormData,
  fallback: CoverBorderStyleValue = "solid",
  key = "coverBorderStyle",
): CoverBorderStyleValue {
  const input = value(formData, key);
  return input === "dashed" || input === "dotted" || input === "double"
    ? input
    : input === "solid"
      ? input
      : fallback;
}

function coverFrameShadowValue(
  formData: FormData,
  fallback: CoverFrameShadowValue = "strong",
  key = "coverFrameShadow",
): CoverFrameShadowValue {
  const input = value(formData, key);
  return input === "none" || input === "soft" || input === "strong"
    ? input
    : fallback;
}

function coverPlacementValue(
  formData: FormData,
  fallback: CoverPlacementValue = "above",
): CoverPlacementValue {
  const input = value(formData, "coverPlacement");
  return input === "left" || input === "right" || input === "above"
    ? input
    : fallback;
}

async function currentLanguageConfiguration() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "site" },
    select: { languageMode: true, defaultLocale: true },
  });
  const languageMode = settings?.languageMode ?? "bilingual";
  const defaultLocale = settings?.defaultLocale ?? "en";

  return {
    languageMode,
    defaultLocale,
    primaryLocale: primaryLocale(languageMode, defaultLocale),
  };
}

async function currentAcademicYearId() {
  const current =
    (await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      orderBy: { sortOrder: "desc" },
    })) ??
    (await prisma.academicYear.findFirst({
      orderBy: { sortOrder: "desc" },
    }));

  return current?.id ?? null;
}

async function nextTeamSortOrder(academicYearId: string) {
  const last = await prisma.teamMemberYear.findFirst({
    where: { academicYearId },
    orderBy: { sortOrder: "desc" },
  });

  return (last?.sortOrder ?? -1) + 1;
}

export async function loginAction(
  _previousState: { error?: string },
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      email: value(formData, "email"),
      password: value(formData, "password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "The email or password is not correct." };
    }
    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateSettings(formData: FormData) {
  await requireAdmin();

  const [previousSettings, previousTheme] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "site" } }),
    prisma.themeSettings.findUnique({ where: { id: "theme" } }),
  ]);
  const languageMode = languageModeValue(formData);
  const requestedLocale: SupportedLocale =
    formData.has("defaultLocale")
      ? value(formData, "defaultLocale") === "nl"
        ? "nl"
        : "en"
      : previousSettings?.defaultLocale ?? "en";
  const defaultLocale = primaryLocale(languageMode, requestedLocale);
  const contentLocale = primaryLocale(languageMode, defaultLocale);
  const logoMode: "wordmark" | "iconWithText" =
    formData.has("logoMode")
      ? value(formData, "logoMode") === "wordmark"
        ? "wordmark"
        : "iconWithText"
      : previousSettings?.logoMode ?? "iconWithText";

  const siteName = localizedFormValues(formData, "siteName", {
    en: previousSettings?.siteNameEn,
    nl: previousSettings?.siteNameNl,
  });
  const headerName = localizedFormValues(formData, "headerName", {
    en: previousSettings?.headerNameEn,
    nl: previousSettings?.headerNameNl,
  });
  const heroEyebrow = localizedFormValues(formData, "heroEyebrow", {
    en: previousSettings?.heroEyebrowEn,
    nl: previousSettings?.heroEyebrowNl,
  });
  const heroTitle = localizedFormValues(formData, "heroTitle", {
    en: previousSettings?.heroTitleEn,
    nl: previousSettings?.heroTitleNl,
  });
  const heroSlogan = localizedFormValues(formData, "heroSlogan", {
    en: previousSettings?.heroSloganEn,
    nl: previousSettings?.heroSloganNl,
  });
  const heroButtonText = localizedFormValues(formData, "heroButtonText", {
    en: previousSettings?.heroButtonTextEn,
    nl: previousSettings?.heroButtonTextNl,
  });
  const aboutTitle = localizedFormValues(formData, "aboutTitle", {
    en: previousSettings?.aboutTitleEn,
    nl: previousSettings?.aboutTitleNl,
  });
  const aboutText = localizedFormValues(
    formData,
    "aboutText",
    {
      en: previousSettings?.aboutTextEn,
      nl: previousSettings?.aboutTextNl,
    },
    true,
  );
  const contactTitle = localizedFormValues(formData, "contactTitle", {
    en: previousSettings?.contactTitleEn,
    nl: previousSettings?.contactTitleNl,
  });
  const contactText = localizedFormValues(
    formData,
    "contactText",
    {
      en: previousSettings?.contactTextEn,
      nl: previousSettings?.contactTextNl,
    },
    true,
  );

  const publicSiteName = canonical(contentLocale, siteName).trim();
  if (!publicSiteName) throw new Error("The website name cannot be empty.");
  if (!canonical(contentLocale, heroTitle).trim()) {
    throw new Error("The hero headline cannot be empty.");
  }
  if (!canonical(contentLocale, aboutText).trim()) {
    throw new Error("The about text cannot be empty.");
  }

  const [logo, favicon, hero, aboutImage] = await Promise.all([
    saveUploadedImage(
      formData.get("logo") as File | null,
      `${publicSiteName} logo`,
    ),
    saveUploadedImage(
      formData.get("favicon") as File | null,
      `${publicSiteName} browser icon`,
    ),
    saveUploadedImage(
      formData.get("hero") as File | null,
      `${publicSiteName} hero`,
    ),
    saveUploadedImage(
      formData.get("aboutImage") as File | null,
      `${publicSiteName} about section`,
    ),
  ]);

  const settingsData = {
    defaultLocale,
    languageMode,
    logoMode,
    siteName: publicSiteName,
    siteNameEn: siteName.en,
    siteNameNl: siteName.nl,
    headerName: canonical(contentLocale, headerName),
    headerNameEn: headerName.en,
    headerNameNl: headerName.nl,
    heroEyebrow: canonical(contentLocale, heroEyebrow),
    heroEyebrowEn: heroEyebrow.en,
    heroEyebrowNl: heroEyebrow.nl,
    heroTitle: canonical(contentLocale, heroTitle),
    heroTitleEn: heroTitle.en,
    heroTitleNl: heroTitle.nl,
    heroSlogan: canonical(contentLocale, heroSlogan) || null,
    heroSloganEn: heroSlogan.en || null,
    heroSloganNl: heroSlogan.nl || null,
    heroButtonText: canonical(contentLocale, heroButtonText) || null,
    heroButtonTextEn: heroButtonText.en || null,
    heroButtonTextNl: heroButtonText.nl || null,
    heroButtonUrl: formData.has("heroButtonUrl")
      ? nullableValue(formData, "heroButtonUrl")
      : previousSettings?.heroButtonUrl ?? null,
    heroTextPosition: heroTextPositionValue(
      formData,
      previousSettings?.heroTextPosition ?? "bottomLeft",
    ),
    heroOverlayIntensity: heroOverlayIntensityValue(
      formData,
      previousSettings?.heroOverlayIntensity ?? 70,
    ),
    aboutTitle: canonical(contentLocale, aboutTitle),
    aboutTitleEn: aboutTitle.en,
    aboutTitleNl: aboutTitle.nl,
    aboutText: canonical(contentLocale, aboutText),
    aboutTextEn: aboutText.en,
    aboutTextNl: aboutText.nl,
    aboutCoverDisplayMode: coverDisplayModeValue(
      formData,
      previousSettings?.aboutCoverDisplayMode ?? "fill",
      "aboutCoverDisplayMode",
    ),
    aboutCoverWidth: clampedFloat(
      formData,
      "aboutCoverWidth",
      previousSettings?.aboutCoverWidth ?? 100,
      25,
      100,
    ),
    aboutCoverPositionX: clampedFloat(
      formData,
      "aboutCoverPositionX",
      previousSettings?.aboutCoverPositionX ?? 50,
      0,
      100,
    ),
    aboutCoverPositionY: clampedFloat(
      formData,
      "aboutCoverPositionY",
      previousSettings?.aboutCoverPositionY ?? 50,
      0,
      100,
    ),
    aboutCoverZoom: clampedFloat(
      formData,
      "aboutCoverZoom",
      previousSettings?.aboutCoverZoom ?? 1,
      1,
      3,
    ),
    aboutCoverBorderWidth: clampedFloat(
      formData,
      "aboutCoverBorderWidth",
      previousSettings?.aboutCoverBorderWidth ?? 0,
      0,
      16,
    ),
    aboutCoverBorderStyle: coverBorderStyleValue(
      formData,
      previousSettings?.aboutCoverBorderStyle ?? "solid",
      "aboutCoverBorderStyle",
    ),
    aboutCoverBorderColor: colorValue(
      formData,
      "aboutCoverBorderColor",
      previousSettings?.aboutCoverBorderColor ?? "#231f20",
    ),
    aboutCoverBorderRadius: clampedFloat(
      formData,
      "aboutCoverBorderRadius",
      previousSettings?.aboutCoverBorderRadius ?? 32,
      0,
      64,
    ),
    aboutCoverFrameShadow: coverFrameShadowValue(
      formData,
      previousSettings?.aboutCoverFrameShadow ?? "strong",
      "aboutCoverFrameShadow",
    ),
    aboutCoverColumnWidth: clampedFloat(
      formData,
      "aboutCoverColumnWidth",
      previousSettings?.aboutCoverColumnWidth ?? 42,
      30,
      60,
    ),
    contactTitle: canonical(contentLocale, contactTitle),
    contactTitleEn: contactTitle.en,
    contactTitleNl: contactTitle.nl,
    contactText: canonical(contentLocale, contactText) || null,
    contactTextEn: contactText.en || null,
    contactTextNl: contactText.nl || null,
    contactEmail: formData.has("contactEmail")
      ? value(formData, "contactEmail")
      : previousSettings?.contactEmail ?? "",
    facebookUrl: formData.has("facebookUrl")
      ? nullableValue(formData, "facebookUrl")
      : previousSettings?.facebookUrl ?? null,
    instagramUrl: formData.has("instagramUrl")
      ? nullableValue(formData, "instagramUrl")
      : previousSettings?.instagramUrl ?? null,
    linkedinUrl: formData.has("linkedinUrl")
      ? nullableValue(formData, "linkedinUrl")
      : previousSettings?.linkedinUrl ?? null,
    logoMediaId:
      formData.get("removeLogo") === "on"
        ? null
        : logo?.id ?? previousSettings?.logoMediaId ?? null,
    faviconMediaId:
      formData.get("removeFavicon") === "on"
        ? null
        : favicon?.id ?? previousSettings?.faviconMediaId ?? null,
    heroMediaId:
      formData.get("removeHero") === "on"
        ? null
        : hero?.id ?? previousSettings?.heroMediaId ?? null,
    aboutMediaId:
      formData.get("removeAboutImage") === "on"
        ? null
        : aboutImage?.id ?? previousSettings?.aboutMediaId ?? null,
  };

  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: settingsData,
    create: { id: "site", ...settingsData },
  });

  const fallbackTheme = {
    backgroundColor: previousTheme?.backgroundColor ?? "#f7f3ec",
    surfaceColor: previousTheme?.surfaceColor ?? "#fffaf2",
    textColor: previousTheme?.textColor ?? "#231f20",
    mutedColor: previousTheme?.mutedColor ?? "#6f6860",
    primaryColor: previousTheme?.primaryColor ?? "#006d77",
    accentColor: previousTheme?.accentColor ?? "#f4a261",
    headerColor: previousTheme?.headerColor ?? "#fffaf2",
  };
  const themeData = {
    backgroundColor: colorValue(
      formData,
      "backgroundColor",
      fallbackTheme.backgroundColor,
    ),
    surfaceColor: colorValue(formData, "surfaceColor", fallbackTheme.surfaceColor),
    textColor: colorValue(formData, "textColor", fallbackTheme.textColor),
    mutedColor: colorValue(formData, "mutedColor", fallbackTheme.mutedColor),
    primaryColor: colorValue(formData, "primaryColor", fallbackTheme.primaryColor),
    accentColor: colorValue(formData, "accentColor", fallbackTheme.accentColor),
    headerColor: colorValue(formData, "headerColor", fallbackTheme.headerColor),
    bodyFontScale: clampedFloat(
      formData,
      "bodyFontScale",
      previousTheme?.bodyFontScale ?? 1,
      0.8,
      1.5,
    ),
    headingFontScale: clampedFloat(
      formData,
      "headingFontScale",
      previousTheme?.headingFontScale ?? 1,
      0.8,
      1.5,
    ),
    heroTitleFontScale: clampedFloat(
      formData,
      "heroTitleFontScale",
      previousTheme?.heroTitleFontScale ?? 1,
      0.8,
      1.5,
    ),
    heroBodyFontScale: clampedFloat(
      formData,
      "heroBodyFontScale",
      previousTheme?.heroBodyFontScale ?? 1,
      0.8,
      1.5,
    ),
  };

  await prisma.themeSettings.upsert({
    where: { id: "theme" },
    update: themeData,
    create: { id: "theme", ...themeData },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/homepage");
  revalidatePath("/admin/header");
  const requestedReturnTo = value(formData, "returnTo");
  const returnTo =
    requestedReturnTo === "/admin/homepage" ||
    requestedReturnTo === "/admin/header"
      ? requestedReturnTo
      : "/admin/settings";
  redirect(`${returnTo}?saved=1`);
}

export async function saveTeamMember(formData: FormData) {
  await requireAdmin();

  const id = nullableValue(formData, "id");
  const [language, previousMember] = await Promise.all([
    currentLanguageConfiguration(),
    id
      ? prisma.teamMember.findUnique({
          where: { id },
          select: { functionNameEn: true, functionNameNl: true },
        })
      : Promise.resolve(null),
  ]);
  const functionName = localizedFormValues(formData, "functionName", {
    en: previousMember?.functionNameEn,
    nl: previousMember?.functionNameNl,
  });
  const publicFunctionName = canonical(language.primaryLocale, functionName);
  if (!publicFunctionName) throw new Error("The team function cannot be empty.");
  if (!id && language.languageMode !== "bilingual") {
    const secondaryLocale = language.primaryLocale === "en" ? "nl" : "en";
    functionName[secondaryLocale] ||= publicFunctionName;
  }
  const image = await saveUploadedImage(
    formData.get("image") as File | null,
    value(formData, "name"),
  );
  const selectedYearIds = formData
    .getAll("academicYearIds")
    .map((yearId) => String(yearId))
    .filter(Boolean);
  const fallbackYearId = await currentAcademicYearId();
  const academicYearIds =
    selectedYearIds.length > 0
      ? selectedYearIds
      : fallbackYearId
        ? [fallbackYearId]
        : [];
  const data = {
    name: value(formData, "name"),
    functionName: publicFunctionName,
    functionNameEn: functionName.en,
    functionNameNl: functionName.nl,
    url: nullableValue(formData, "url"),
    isVisible: formData.get("isVisible") === "on",
    ...(image ? { imageMediaId: image.id } : {}),
  };

  const member = id
    ? await prisma.teamMember.update({ where: { id }, data })
    : await prisma.teamMember.create({
        data: {
          ...data,
          sortOrder: 0,
        },
      });

  if (academicYearIds.length > 0) {
    await prisma.teamMemberYear.deleteMany({
      where: {
        teamMemberId: member.id,
        academicYearId: { notIn: academicYearIds },
      },
    });

    for (const academicYearId of academicYearIds) {
      await prisma.teamMemberYear.upsert({
        where: {
          teamMemberId_academicYearId: {
            teamMemberId: member.id,
            academicYearId,
          },
        },
        update: {},
        create: {
          teamMemberId: member.id,
          academicYearId,
          sortOrder: await nextTeamSortOrder(academicYearId),
        },
      });
    }
  } else {
    await prisma.teamMemberYear.deleteMany({
      where: { teamMemberId: member.id },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/team");
}

export async function deleteTeamMember(formData: FormData) {
  await requireAdmin();
  await prisma.teamMember.delete({ where: { id: value(formData, "id") } });
  revalidatePath("/");
  revalidatePath("/admin/team");
}

export async function saveAcademicYear(formData: FormData) {
  await requireAdmin();

  const label = value(formData, "label");
  if (!label) return;
  const lastYear = await prisma.academicYear.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const chronologicalOrder = Number.parseInt(label.match(/^\d{4}/)?.[0] ?? "", 10);

  await prisma.academicYear.upsert({
    where: { label },
    update: {},
    create: {
      label,
      sortOrder: Number.isFinite(chronologicalOrder)
        ? chronologicalOrder
        : (lastYear?.sortOrder ?? 0) + 1,
      isCurrent: false,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/team");
}

export async function setCurrentAcademicYear(formData: FormData) {
  await requireAdmin();
  const id = value(formData, "id");

  await prisma.$transaction([
    prisma.academicYear.updateMany({ data: { isCurrent: false } }),
    prisma.academicYear.update({ where: { id }, data: { isCurrent: true } }),
  ]);

  revalidatePath("/");
  revalidatePath("/admin/team");
}

export async function updateTeamMemberOrder(
  academicYearId: string,
  orderedIds: string[],
) {
  await requireAdmin();

  await prisma.$transaction(
    orderedIds.map((teamMemberId, index) =>
      prisma.teamMemberYear.update({
        where: {
          teamMemberId_academicYearId: {
            teamMemberId,
            academicYearId,
          },
        },
        data: { sortOrder: index },
      }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/admin/team");
}

async function availableCustomPageSlug(input: string, currentId?: string | null) {
  const base = slugify(input) || "page";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.customPage.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function saveCustomPage(formData: FormData) {
  await requireAdmin();

  const id = nullableValue(formData, "id");
  const [language, previousPage, lastPage, lastSection] = await Promise.all([
    currentLanguageConfiguration(),
    id
      ? prisma.customPage.findUnique({
          where: { id },
          select: {
            slug: true,
            titleEn: true,
            titleNl: true,
            eyebrowEn: true,
            eyebrowNl: true,
            supportingTextEn: true,
            supportingTextNl: true,
            contentEn: true,
            contentNl: true,
            coverMediaId: true,
            coverDisplayMode: true,
            coverWidth: true,
            coverPositionX: true,
            coverPositionY: true,
            coverZoom: true,
            coverBorderWidth: true,
            coverBorderStyle: true,
            coverBorderColor: true,
            coverBorderRadius: true,
            coverFrameShadow: true,
            coverPlacement: true,
            coverSideWidth: true,
            sortOrder: true,
          },
        })
      : Promise.resolve(null),
    id
      ? Promise.resolve(null)
      : prisma.customPage.findFirst({
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        }),
    id
      ? Promise.resolve(null)
      : prisma.siteSection.findFirst({
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        }),
  ]);

  const title = localizedFormValues(formData, "title", {
    en: previousPage?.titleEn,
    nl: previousPage?.titleNl,
  });
  const eyebrow = localizedFormValues(formData, "eyebrow", {
    en: previousPage?.eyebrowEn,
    nl: previousPage?.eyebrowNl,
  });
  const supportingText = localizedFormValues(formData, "supportingText", {
    en: previousPage?.supportingTextEn,
    nl: previousPage?.supportingTextNl,
  });
  const content = localizedFormValues(
    formData,
    "content",
    {
      en: previousPage?.contentEn,
      nl: previousPage?.contentNl,
    },
    true,
  );
  const publicTitle = canonical(language.primaryLocale, title);

  if (!publicTitle) throw new Error("The page title cannot be empty.");

  if (!id && language.languageMode !== "bilingual") {
    const secondaryLocale = language.primaryLocale === "en" ? "nl" : "en";
    title[secondaryLocale] ||= publicTitle;
  }

  const cover = await saveUploadedImage(
    formData.get("cover") as File | null,
    publicTitle,
  );
  const requestedSlug =
    nullableValue(formData, "slug") ?? previousPage?.slug ?? publicTitle;
  let slug = await availableCustomPageSlug(requestedSlug, id);
  const nextNavigationOrder =
    Math.max(lastPage?.sortOrder ?? -1, lastSection?.sortOrder ?? -1) + 1;
  const data = {
    slug,
    titleEn: title.en,
    titleNl: title.nl,
    eyebrowEn: eyebrow.en || null,
    eyebrowNl: eyebrow.nl || null,
    supportingTextEn: supportingText.en || null,
    supportingTextNl: supportingText.nl || null,
    contentEn: content.en,
    contentNl: content.nl,
    coverDisplayMode: coverDisplayModeValue(
      formData,
      previousPage?.coverDisplayMode ?? "fill",
    ),
    coverWidth: clampedFloat(
      formData,
      "coverWidth",
      previousPage?.coverWidth ?? 75,
      25,
      100,
    ),
    coverPositionX: clampedFloat(
      formData,
      "coverPositionX",
      previousPage?.coverPositionX ?? 50,
      0,
      100,
    ),
    coverPositionY: clampedFloat(
      formData,
      "coverPositionY",
      previousPage?.coverPositionY ?? 50,
      0,
      100,
    ),
    coverZoom: clampedFloat(
      formData,
      "coverZoom",
      previousPage?.coverZoom ?? 1,
      1,
      3,
    ),
    coverBorderWidth: clampedFloat(
      formData,
      "coverBorderWidth",
      previousPage?.coverBorderWidth ?? 0,
      0,
      16,
    ),
    coverBorderStyle: coverBorderStyleValue(
      formData,
      previousPage?.coverBorderStyle ?? "solid",
    ),
    coverBorderColor: colorValue(
      formData,
      "coverBorderColor",
      previousPage?.coverBorderColor ?? "#231f20",
    ),
    coverBorderRadius: clampedFloat(
      formData,
      "coverBorderRadius",
      previousPage?.coverBorderRadius ?? 32,
      0,
      64,
    ),
    coverFrameShadow: coverFrameShadowValue(
      formData,
      previousPage?.coverFrameShadow ?? "strong",
    ),
    coverPlacement: coverPlacementValue(
      formData,
      previousPage?.coverPlacement ?? "above",
    ),
    coverSideWidth: clampedFloat(
      formData,
      "coverSideWidth",
      previousPage?.coverSideWidth ?? 42,
      30,
      60,
    ),
    sortOrder: previousPage?.sortOrder ?? nextNavigationOrder,
    isPublished: formData.get("isPublished") === "on",
    showInNavigation: formData.get("showInNavigation") === "on",
    coverMediaId:
      formData.get("removeCover") === "on"
        ? null
        : cover?.id ?? previousPage?.coverMediaId ?? null,
  };

  let savedPageId = id;
  for (let attempt = 0; ; attempt += 1) {
    try {
      if (id) {
        await prisma.customPage.update({ where: { id }, data });
      } else {
        const createdPage = await prisma.customPage.create({
          data,
          select: { id: true },
        });
        savedPageId = createdPage.id;
      }
      break;
    } catch (error) {
      if (attempt >= 2 || !isUniqueConstraintError(error)) throw error;
      slug = await availableCustomPageSlug(requestedSlug, id);
      data.slug = slug;
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/pages");
  revalidatePath(`/pages/${slug}`);
  if (previousPage?.slug && previousPage.slug !== slug) {
    revalidatePath(`/pages/${previousPage.slug}`);
  }
  redirect(`/admin/pages?saved=${encodeURIComponent(savedPageId ?? "")}`);
}

export async function deleteCustomPage(formData: FormData) {
  await requireAdmin();
  const id = value(formData, "id");
  const page = await prisma.customPage.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!page) return;

  await prisma.customPage.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/pages");
  revalidatePath(`/pages/${page.slug}`);
}

async function availableAlbumSlug(input: string, currentId?: string | null) {
  const base = slugify(input) || "album";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.photoAlbum.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function revalidateAlbum(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/photos");
  revalidatePath("/admin/photos");
  if (slug) revalidatePath(`/photos/${slug}`);
}

export async function savePhotoAlbum(formData: FormData) {
  await requireAdmin();

  const id = nullableValue(formData, "id");
  const [language, previousAlbum, lastAlbum] = await Promise.all([
    currentLanguageConfiguration(),
    id
      ? prisma.photoAlbum.findUnique({
          where: { id },
          select: {
            slug: true,
            titleEn: true,
            titleNl: true,
            descriptionEn: true,
            descriptionNl: true,
            sortOrder: true,
          },
        })
      : Promise.resolve(null),
    id
      ? Promise.resolve(null)
      : prisma.photoAlbum.findFirst({
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        }),
  ]);

  const title = localizedFormValues(formData, "title", {
    en: previousAlbum?.titleEn,
    nl: previousAlbum?.titleNl,
  });
  const publicTitle = canonical(language.primaryLocale, title);

  if (!publicTitle) throw new Error("The album needs a title.");

  if (!id && language.languageMode !== "bilingual") {
    const secondaryLocale = language.primaryLocale === "en" ? "nl" : "en";
    title[secondaryLocale] ||= publicTitle;
  }

  const description = localizedFormValues(
    formData,
    "description",
    { en: previousAlbum?.descriptionEn, nl: previousAlbum?.descriptionNl },
    true,
  );
  const slug = await availableAlbumSlug(
    value(formData, "slug") || publicTitle,
    id,
  );
  const data = {
    slug,
    titleEn: title.en,
    titleNl: title.nl,
    descriptionEn: description.en || null,
    descriptionNl: description.nl || null,
    takenOn: dateValue(formData, "takenOn"),
    isPublished: formData.get("isPublished") === "on",
    sortOrder: previousAlbum?.sortOrder ?? (lastAlbum?.sortOrder ?? -1) + 1,
  };

  const album = id
    ? await prisma.photoAlbum.update({ where: { id }, data })
    : await prisma.photoAlbum.create({ data });

  revalidateAlbum(album.slug);
  if (previousAlbum && previousAlbum.slug !== album.slug) {
    revalidatePath(`/photos/${previousAlbum.slug}`);
  }

  // A new album is useless until it has photos, so drop the admin straight into
  // it with the uploader open.
  if (!id) {
    redirect(`/admin/photos?album=${album.id}`);
  }
}

export async function deletePhotoAlbum(formData: FormData) {
  await requireAdmin();

  const id = value(formData, "id");
  const album = await prisma.photoAlbum.findUnique({
    where: { id },
    select: {
      slug: true,
      photos: { select: { fileName: true, thumbName: true } },
    },
  });

  if (!album) return;

  // Delete the rows first. If the unlinks fail halfway the quota is still
  // correct; the reverse order could leave rows pointing at missing files.
  await prisma.photoAlbum.delete({ where: { id } });
  await removePhotoFiles(
    album.photos.flatMap((photo) => [photo.fileName, photo.thumbName]),
  );

  revalidateAlbum(album.slug);
}

export async function deletePhoto(formData: FormData) {
  await requireAdmin();

  const id = value(formData, "id");
  const photo = await prisma.photo.findUnique({
    where: { id },
    select: {
      fileName: true,
      thumbName: true,
      albumId: true,
      album: { select: { slug: true, coverPhotoId: true } },
    },
  });

  if (!photo) return;

  await prisma.photo.delete({ where: { id } });
  await removePhotoFiles([photo.fileName, photo.thumbName]);

  // The cover is set to null by the database; give the album a new one so it
  // does not fall back to a blank card in the grid.
  if (photo.album.coverPhotoId === id) {
    const replacement = await prisma.photo.findFirst({
      where: { albumId: photo.albumId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    await prisma.photoAlbum.update({
      where: { id: photo.albumId },
      data: { coverPhotoId: replacement?.id ?? null },
    });
  }

  revalidateAlbum(photo.album.slug);
}

export async function setAlbumCover(formData: FormData) {
  await requireAdmin();

  const photoId = value(formData, "photoId");
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { albumId: true, album: { select: { slug: true } } },
  });

  if (!photo) return;

  await prisma.photoAlbum.update({
    where: { id: photo.albumId },
    data: { coverPhotoId: photoId },
  });

  revalidateAlbum(photo.album.slug);
}

export async function saveEvent(formData: FormData) {
  await requireAdmin();

  const id = nullableValue(formData, "id");
  const [language, previousEvent] = await Promise.all([
    currentLanguageConfiguration(),
    id
      ? prisma.event.findUnique({
          where: { id },
          select: {
            titleEn: true,
            titleNl: true,
            summaryEn: true,
            summaryNl: true,
            descriptionEn: true,
            descriptionNl: true,
            locationEn: true,
            locationNl: true,
            slug: true,
          },
        })
      : Promise.resolve(null),
  ]);
  const title = localizedFormValues(formData, "title", {
    en: previousEvent?.titleEn,
    nl: previousEvent?.titleNl,
  });
  const summary = localizedFormValues(formData, "summary", {
    en: previousEvent?.summaryEn,
    nl: previousEvent?.summaryNl,
  });
  const description = localizedFormValues(
    formData,
    "description",
    {
      en: previousEvent?.descriptionEn,
      nl: previousEvent?.descriptionNl,
    },
    true,
  );
  const location = localizedFormValues(formData, "location", {
    en: previousEvent?.locationEn,
    nl: previousEvent?.locationNl,
  });
  const publicTitle = canonical(language.primaryLocale, title);
  const publicDescription = canonical(language.primaryLocale, description).trim();
  const publicLocation = canonical(language.primaryLocale, location).trim();
  const startAt = dateValue(formData, "startAt");
  const endAt = dateValue(formData, "endAt");

  if (!publicTitle) throw new Error("The event title cannot be empty.");
  if (!publicDescription) {
    throw new Error("The event description cannot be empty.");
  }
  if (!publicLocation) throw new Error("The event location cannot be empty.");
  if (!startAt || !Number.isFinite(startAt.getTime())) {
    throw new Error("Choose a valid event start date and time.");
  }
  if (endAt && !Number.isFinite(endAt.getTime())) {
    throw new Error("Choose a valid event end date and time.");
  }
  if (endAt && endAt < startAt) {
    throw new Error("The event end cannot be before its start.");
  }

  if (!id && language.languageMode !== "bilingual") {
    const secondaryLocale = language.primaryLocale === "en" ? "nl" : "en";
    title[secondaryLocale] ||= publicTitle;
    summary[secondaryLocale] ||= canonical(language.primaryLocale, summary);
    description[secondaryLocale] ||= canonical(language.primaryLocale, description);
    location[secondaryLocale] ||= canonical(language.primaryLocale, location);
  }

  const picture = await saveUploadedImage(
    formData.get("picture") as File | null,
    publicTitle,
  );
  const slug = nullableValue(formData, "slug") ?? slugify(publicTitle);
  const data = {
    title: publicTitle,
    titleEn: title.en,
    titleNl: title.nl,
    slug,
    summary: canonical(language.primaryLocale, summary) || null,
    summaryEn: summary.en || null,
    summaryNl: summary.nl || null,
    description: publicDescription,
    descriptionEn: description.en,
    descriptionNl: description.nl,
    location: publicLocation,
    locationEn: location.en,
    locationNl: location.nl,
    startAt,
    endAt,
    isPublished: formData.get("isPublished") === "on",
    ...(picture ? { pictureMediaId: picture.id } : {}),
  };

  if (id) {
    await prisma.event.update({ where: { id }, data });
  } else {
    await prisma.event.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/admin/events");
  revalidatePath(`/events/${slug}`);
  if (previousEvent?.slug && previousEvent.slug !== slug) {
    revalidatePath(`/events/${previousEvent.slug}`);
  }
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  await prisma.event.delete({ where: { id: value(formData, "id") } });
  revalidatePath("/");
  revalidatePath("/admin/events");
}

export async function savePartner(formData: FormData) {
  await requireAdmin();

  const id = nullableValue(formData, "id");
  const [language, previousPartner, lastPartner] = await Promise.all([
    currentLanguageConfiguration(),
    id
      ? prisma.partner.findUnique({
          where: { id },
          select: { nameEn: true, nameNl: true, sortOrder: true },
        })
      : Promise.resolve(null),
    id
      ? Promise.resolve(null)
      : prisma.partner.findFirst({
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        }),
  ]);
  const partnerName = localizedFormValues(formData, "name", {
    en: previousPartner?.nameEn,
    nl: previousPartner?.nameNl,
  });
  const publicName = canonical(language.primaryLocale, partnerName);
  if (!publicName) throw new Error("The partner name cannot be empty.");
  if (!id && language.languageMode !== "bilingual") {
    const secondaryLocale = language.primaryLocale === "en" ? "nl" : "en";
    partnerName[secondaryLocale] ||= publicName;
  }
  const logo = await saveUploadedImage(
    formData.get("logo") as File | null,
    publicName,
  );
  const data = {
    name: publicName,
    nameEn: partnerName.en,
    nameNl: partnerName.nl,
    websiteUrl: value(formData, "websiteUrl"),
    sortOrder: previousPartner?.sortOrder ?? (lastPartner?.sortOrder ?? -1) + 1,
    isVisible: formData.get("isVisible") === "on",
    ...(logo ? { logoMediaId: logo.id } : {}),
  };

  if (id) {
    await prisma.partner.update({ where: { id }, data });
  } else {
    await prisma.partner.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/admin/partners");
}

export async function deletePartner(formData: FormData) {
  await requireAdmin();
  await prisma.partner.delete({ where: { id: value(formData, "id") } });
  revalidatePath("/");
  revalidatePath("/admin/partners");
}

export async function updatePartnerOrder(orderedIds: string[]) {
  await requireAdmin();
  const uniqueIds = [...new Set(orderedIds)].filter(Boolean);

  await prisma.$transaction(
    uniqueIds.map((id, index) =>
      prisma.partner.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/admin/partners");
}

type SiteSectionKey =
  | "about"
  | "team"
  | "events"
  | "contact"
  | "partners"
  | "photos";

type HomepageSectionInput = {
  key: SiteSectionKey;
  isVisible: boolean;
};

type HeaderNavigationItemInput =
  | { type: "section"; key: SiteSectionKey; showInNavigation: boolean }
  | { type: "page"; id: string; showInNavigation: boolean };

const siteSectionKeys = new Set<SiteSectionKey>([
  "about",
  "team",
  "events",
  "contact",
  "partners",
  "photos",
]);

export async function updateHomepageSections(items: HomepageSectionInput[]) {
  await requireAdmin();
  const submittedKeys = new Set(items.map((item) => item.key));

  if (
    items.length !== siteSectionKeys.size ||
    submittedKeys.size !== siteSectionKeys.size ||
    items.some((item) => !siteSectionKeys.has(item.key))
  ) {
    throw new Error("The homepage order is incomplete. Refresh and try again.");
  }

  await prisma.$transaction(
    items.map((item, index) =>
      prisma.siteSection.upsert({
        where: { key: item.key },
        update: {
          homepageOrder: index,
          isVisible: Boolean(item.isVisible),
          ...(!item.isVisible ? { showInNavigation: false } : {}),
        },
        create: {
          key: item.key,
          sortOrder: index,
          homepageOrder: index,
          isVisible: Boolean(item.isVisible),
          showInNavigation: Boolean(item.isVisible),
        },
      }),
    ),
  );

  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function updateHeaderNavigation(
  items: HeaderNavigationItemInput[],
) {
  await requireAdmin();
  const sectionItems = items.filter(
    (item): item is Extract<HeaderNavigationItemInput, { type: "section" }> =>
      item.type === "section",
  );
  const pageItems = items.filter(
    (item): item is Extract<HeaderNavigationItemInput, { type: "page" }> =>
      item.type === "page",
  );
  const storedPages = await prisma.customPage.findMany({ select: { id: true } });
  const storedPageIds = new Set(storedPages.map((page) => page.id));
  const submittedSectionKeys = new Set(sectionItems.map((item) => item.key));
  const submittedPageIds = new Set(pageItems.map((item) => item.id));

  if (
    items.length !== sectionItems.length + pageItems.length ||
    sectionItems.length !== siteSectionKeys.size ||
    submittedSectionKeys.size !== siteSectionKeys.size ||
    sectionItems.some((item) => !siteSectionKeys.has(item.key)) ||
    pageItems.length !== storedPageIds.size ||
    submittedPageIds.size !== storedPageIds.size ||
    pageItems.some((item) => !storedPageIds.has(item.id))
  ) {
    throw new Error("The navigation order is incomplete. Refresh and try again.");
  }

  await prisma.$transaction(
    items.map((item, index) => {
      if (item.type === "page") {
        return prisma.customPage.update({
          where: { id: item.id },
          data: {
            sortOrder: index,
            showInNavigation: Boolean(item.showInNavigation),
          },
        });
      }

      return prisma.siteSection.upsert({
        where: { key: item.key },
        update: {
          sortOrder: index,
          showInNavigation: Boolean(item.showInNavigation),
        },
        create: {
          key: item.key,
          sortOrder: index,
          homepageOrder: index,
          isVisible: true,
          showInNavigation: Boolean(item.showInNavigation),
        },
      });
    }),
  );

  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/pages");
}
