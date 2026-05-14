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

  const [settings, theme, teamMemberships, events, partners] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { id: "site" },
      include: { logoMedia: true, heroMedia: true },
    }),
    prisma.themeSettings.findUnique({ where: { id: "theme" } }),
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
  ]);

  return {
    settings: settings ?? defaultSettings,
    theme: theme ?? defaultTheme,
    currentAcademicYear,
    teamMembers: teamMemberships.map((membership) => membership.teamMember),
    events,
    partners,
  };
}

export const defaultSettings = {
  id: "site",
  defaultLocale: "en" as const,
  siteName: "Chemix",
  siteNameEn: "Chemix",
  siteNameNl: "Chemix",
  headerName: "Chemix",
  headerNameEn: "Chemix",
  headerNameNl: "Chemix",
  logoMediaId: null,
  logoMedia: null,
  heroMediaId: null,
  heroMedia: null,
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
  aboutTitle: "About us",
  aboutTitleEn: "About us",
  aboutTitleNl: "Over ons",
  aboutText:
    "We bring students together around study support, professional opportunities, and low-threshold activities. The result is a small community with enough room for ambition and enough warmth to feel at home.",
  aboutTextEn:
    "We bring students together around study support, professional opportunities, and low-threshold activities. The result is a small community with enough room for ambition and enough warmth to feel at home.",
  aboutTextNl:
    "We brengen studenten samen rond studieondersteuning, professionele kansen en laagdrempelige activiteiten. Zo ontstaat een kleine community met ruimte voor ambitie en genoeg warmte om je thuis te voelen.",
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
  createdAt: new Date(),
  updatedAt: new Date(),
};
