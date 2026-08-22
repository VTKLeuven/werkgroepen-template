import { prisma } from "@/lib/prisma";

export async function getSiteData() {
  const currentAcademicYear =
    (await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      orderBy: { sortOrder: "desc" },
    })) ??
    (await prisma.academicYear.findFirst({
      orderBy: { sortOrder: "desc" },
    }));

  const [
    settings,
    theme,
    sections,
    teamMemberships,
    events,
    partners,
    customPages,
    photoAlbums,
  ] =
    await Promise.all([
      prisma.siteSettings.findUnique({
        where: { id: "site" },
        include: {
          logoMedia: true,
          faviconMedia: true,
          heroMedia: true,
          aboutMedia: true,
        },
      }),
      prisma.themeSettings.findUnique({ where: { id: "theme" } }),
      prisma.siteSection.findMany({
        orderBy: [{ homepageOrder: "asc" }, { key: "asc" }],
      }),
      currentAcademicYear
        ? prisma.teamMemberYear.findMany({
            where: {
              academicYearId: currentAcademicYear.id,
              teamMember: { isVisible: true },
            },
            include: {
              teamMember: { include: { imageMedia: true } },
            },
            orderBy: [{ sortOrder: "asc" }, { teamMember: { name: "asc" } }],
          })
        : Promise.resolve([]),
      prisma.event.findMany({
        where: { isPublished: true },
        include: { pictureMedia: true },
        orderBy: { startAt: "asc" },
      }),
      prisma.partner.findMany({
        where: { isVisible: true },
        include: { logoMedia: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.customPage.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          slug: true,
          titleEn: true,
          titleNl: true,
          showInNavigation: true,
          sortOrder: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      // Only what the homepage preview strip needs; the full grid is fetched by
      // /photos itself.
      prisma.photoAlbum.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          slug: true,
          titleEn: true,
          titleNl: true,
          takenOn: true,
          coverPhotoId: true,
          _count: { select: { photos: true } },
        },
        orderBy: [{ takenOn: "desc" }, { createdAt: "desc" }],
        take: 4,
      }),
    ]);

  const storedSectionKeys = new Set(sections.map((section) => section.key));
  const orderedSections = [
    ...sections,
    ...defaultSections.filter((section) => !storedSectionKeys.has(section.key)),
  ].sort((left, right) => left.homepageOrder - right.homepageOrder);

  return {
    settings: settings ?? defaultSettings,
    theme: theme ?? defaultTheme,
    sections: orderedSections,
    currentAcademicYear,
    teamMembers: teamMemberships.map((membership) => membership.teamMember),
    events,
    partners,
    customPages,
    photoAlbums,
  };
}

export const defaultSettings = {
  id: "site",
  defaultLocale: "en" as const,
  languageMode: "bilingual" as const,
  siteName: "Chemix",
  siteNameEn: "Chemix",
  siteNameNl: "Chemix",
  headerName: "Chemix",
  headerNameEn: "Chemix",
  headerNameNl: "Chemix",
  logoMode: "iconWithText" as const,
  logoMediaId: null,
  logoMedia: null,
  faviconMediaId: null,
  faviconMedia: null,
  heroMediaId: null,
  heroMedia: null,
  aboutMediaId: null,
  aboutMedia: null,
  heroEyebrow: "VTK subdivision",
  heroEyebrowEn: "VTK subdivision",
  heroEyebrowNl: "VTK werkgroep",
  heroTitle: "A student community for curious engineers",
  heroTitleEn: "A student community for curious engineers",
  heroTitleNl: "Een studentencommunity voor nieuwsgierige ingenieurs",
  heroSlogan:
    "Lectures, company evenings, friendships, and the kind of projects that make a faculty feel alive.",
  heroSloganEn:
    "Lectures, company evenings, friendships, and the kind of projects that make a faculty feel alive.",
  heroSloganNl:
    "Lezingen, bedrijfsavonden, vriendschappen en projecten die de faculteit doen leven.",
  heroButtonText: "See our events",
  heroButtonTextEn: "See our events",
  heroButtonTextNl: "Bekijk onze events",
  heroButtonUrl: "#events",
  heroTextPosition: "bottomLeft" as const,
  heroOverlayIntensity: 70,
  aboutTitle: "About us",
  aboutTitleEn: "About us",
  aboutTitleNl: "Over ons",
  aboutText:
    "We bring students together around study support, professional opportunities, and low-threshold activities. The result is a small community with enough room for ambition and enough warmth to feel at home.",
  aboutTextEn:
    "We bring students together around study support, professional opportunities, and low-threshold activities. The result is a small community with enough room for ambition and enough warmth to feel at home.",
  aboutTextNl:
    "We brengen studenten samen rond studieondersteuning, professionele kansen en laagdrempelige activiteiten. Zo ontstaat een kleine community met ruimte voor ambitie en genoeg warmte om je thuis te voelen.",
  aboutCoverDisplayMode: "fill" as const,
  aboutCoverWidth: 100,
  aboutCoverPositionX: 50,
  aboutCoverPositionY: 50,
  aboutCoverZoom: 1,
  aboutCoverBorderWidth: 0,
  aboutCoverBorderStyle: "solid" as const,
  aboutCoverBorderColor: "#231f20",
  aboutCoverBorderRadius: 32,
  aboutCoverFrameShadow: "strong" as const,
  aboutCoverColumnWidth: 42,
  contactTitle: "Contact us",
  contactTitleEn: "Contact us",
  contactTitleNl: "Contacteer ons",
  contactText:
    "Questions, partnership ideas, or just want to say hello? Reach us through mail or one of our social channels.",
  contactTextEn:
    "Questions, partnership ideas, or just want to say hello? Reach us through mail or one of our social channels.",
  contactTextNl:
    "Vragen, ideeen voor samenwerkingen of gewoon even hallo zeggen? Je bereikt ons via mail of via onze sociale kanalen.",
  contactEmail: "hello@example.org",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const defaultTheme = {
  id: "theme",
  backgroundColor: "#f7f3ec",
  surfaceColor: "#fffaf2",
  textColor: "#231f20",
  mutedColor: "#6f6860",
  primaryColor: "#006d77",
  accentColor: "#f4a261",
  headerColor: "#fffaf2",
  bodyFontScale: 1,
  headingFontScale: 1,
  heroTitleFontScale: 1,
  heroBodyFontScale: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const defaultSections = [
  {
    key: "about" as const,
    sortOrder: 0,
    homepageOrder: 0,
    isVisible: true,
    showInNavigation: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: "team" as const,
    sortOrder: 1,
    homepageOrder: 1,
    isVisible: true,
    showInNavigation: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: "events" as const,
    sortOrder: 2,
    homepageOrder: 2,
    isVisible: true,
    showInNavigation: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: "contact" as const,
    sortOrder: 3,
    homepageOrder: 3,
    isVisible: true,
    showInNavigation: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: "partners" as const,
    sortOrder: 4,
    homepageOrder: 4,
    isVisible: true,
    showInNavigation: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    key: "photos" as const,
    sortOrder: 5,
    homepageOrder: 5,
    isVisible: true,
    showInNavigation: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
