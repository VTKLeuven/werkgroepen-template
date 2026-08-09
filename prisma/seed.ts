import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { slugify } from "../src/lib/format";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const defaultSections = [
  { key: "about", sortOrder: 0 },
  { key: "team", sortOrder: 1 },
  { key: "events", sortOrder: 2 },
  { key: "contact", sortOrder: 3 },
  { key: "partners", sortOrder: 4 },
] as const;

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("Skipping admin seed: ADMIN_EMAIL and ADMIN_PASSWORD are required.");
    return;
  }

  // Refuse the .env.example placeholders rather than seeding an admin account
  // with publicly known credentials.
  if (password === "change-me-before-deploy") {
    throw new Error(
      "ADMIN_PASSWORD is still the .env.example placeholder. Set a real value in .env and restart.",
    );
  }

  // format: raw keeps quotes literal, so a quoted .env value would silently
  // become part of the password and login would never match.
  if (/^["'][\s\S]*["']$/.test(password)) {
    throw new Error(
      "ADMIN_PASSWORD is wrapped in quotes. Write it unquoted in .env, otherwise the quotes become part of the password.",
    );
  }

  await prisma.adminUser.upsert({
    where: { email },
    update: {
      passwordHash: await hash(password, 12),
    },
    create: {
      email,
      passwordHash: await hash(password, 12),
    },
  });
}

async function seedSettings() {
  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      defaultLocale: "en",
      languageMode: "bilingual",
      siteName: "Chemix",
      siteNameEn: "Chemix",
      siteNameNl: "Chemix",
      headerName: "Chemix",
      headerNameEn: "Chemix",
      headerNameNl: "Chemix",
      logoMode: "iconWithText",
      heroEyebrow: "VTK subdivision",
      heroEyebrowEn: "VTK subdivision",
      heroEyebrowNl: "VTK werkgroep",
      heroTitle: "A home base for curious chemical engineers",
      heroTitleEn: "A home base for curious chemical engineers",
      heroTitleNl: "Een thuisbasis voor nieuwsgierige chemische ingenieurs",
      heroSlogan:
        "Company nights, study support, relaxed socials, and a tighter community inside a big faculty.",
      heroSloganEn:
        "Company nights, study support, relaxed socials, and a tighter community inside a big faculty.",
      heroSloganNl:
        "Bedrijfsavonden, studiehulp, ontspannen activiteiten en een hechte community binnen een grote faculteit.",
      heroButtonText: "Discover events",
      heroButtonTextEn: "Discover events",
      heroButtonTextNl: "Ontdek events",
      heroButtonUrl: "#events",
      aboutTitle: "About us",
      aboutTitleEn: "About us",
      aboutTitleNl: "Over ons",
      aboutText:
        "Chemix brings students together through career-focused events, study initiatives, and evenings that make the department feel smaller in the best way. The website is a living noticeboard for everything the team wants to share.",
      aboutTextEn:
        "Chemix brings students together through career-focused events, study initiatives, and evenings that make the department feel smaller in the best way. The website is a living noticeboard for everything the team wants to share.",
      aboutTextNl:
        "Chemix brengt studenten samen via career events, studie-initiatieven en avonden die de richting kleiner doen aanvoelen op de beste manier. De website is een levend prikbord voor alles wat de ploeg wil delen.",
      contactTitle: "Talk to us",
      contactTitleEn: "Talk to us",
      contactTitleNl: "Spreek ons aan",
      contactText:
        "For questions, collaborations, or practical information, mail the team or follow the active channels below.",
      contactTextEn:
        "For questions, collaborations, or practical information, mail the team or follow the active channels below.",
      contactTextNl:
        "Voor vragen, samenwerkingen of praktische info kan je de ploeg mailen of de actieve kanalen hieronder volgen.",
      contactEmail: "chemix@vtk.be",
      instagramUrl: "https://www.instagram.com/",
      facebookUrl: "https://www.facebook.com/",
      linkedinUrl: "https://www.linkedin.com/",
    },
  });

  await prisma.themeSettings.upsert({
    where: { id: "theme" },
    update: {},
    create: {
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
    },
  });
}

async function seedSections() {
  await Promise.all(
    defaultSections.map((section) =>
      prisma.siteSection.upsert({
        where: { key: section.key },
        update: {},
        create: {
          ...section,
          isVisible: true,
          showInNavigation: true,
        },
      }),
    ),
  );
}

async function seedAcademicYears() {
  await prisma.academicYear.upsert({
    where: { label: "2024-2025" },
    update: {},
    create: {
      label: "2024-2025",
      sortOrder: 2024,
      isCurrent: false,
    },
  });

  await prisma.academicYear.upsert({
    where: { label: "2025-2026" },
    update: {},
    create: {
      label: "2025-2026",
      sortOrder: 2025,
      isCurrent: false,
    },
  });

  const currentYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
  });

  if (!currentYear) {
    await prisma.academicYear.update({
      where: { label: "2025-2026" },
      data: { isCurrent: true },
    });
  }
}

async function seedContent() {
  const [teamCount, eventCount, partnerCount] = await Promise.all([
    prisma.teamMember.count(),
    prisma.event.count(),
    prisma.partner.count(),
  ]);

  if (teamCount === 0) {
    await prisma.teamMember.createMany({
      data: [
        {
          name: "Alex Peeters",
          functionName: "President",
          functionNameEn: "President",
          functionNameNl: "Praeses",
          url: "https://www.linkedin.com/",
          sortOrder: 1,
        },
        {
          name: "Sam De Smet",
          functionName: "Events",
          functionNameEn: "Events",
          functionNameNl: "Events",
          url: "https://www.linkedin.com/",
          sortOrder: 2,
        },
        {
          name: "Noor Janssens",
          functionName: "Partners",
          functionNameEn: "Partners",
          functionNameNl: "Partners",
          url: "https://www.linkedin.com/",
          sortOrder: 3,
        },
      ],
    });
  }

  const currentYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
  });

  if (currentYear) {
    const members = await prisma.teamMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    for (const [index, member] of members.entries()) {
      await prisma.teamMemberYear.upsert({
        where: {
          teamMemberId_academicYearId: {
            teamMemberId: member.id,
            academicYearId: currentYear.id,
          },
        },
        update: {},
        create: {
          teamMemberId: member.id,
          academicYearId: currentYear.id,
          sortOrder: member.sortOrder || index,
        },
      });
    }
  }

  if (eventCount === 0) {
    const now = new Date();
    const daysFromNow = (days: number, hour: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      date.setHours(hour, 0, 0, 0);
      return date;
    };

    await prisma.event.createMany({
      data: [
        {
          title: "Industry Night",
          titleEn: "Industry Night",
          titleNl: "Industry Night",
          slug: slugify("Industry Night"),
          summary: "An evening of honest conversations with companies and alumni.",
          summaryEn: "An evening of honest conversations with companies and alumni.",
          summaryNl: "Een avond met eerlijke gesprekken met bedrijven en alumni.",
          description:
            "Meet engineers in the field, ask direct questions, and discover what work after graduation can look like.",
          descriptionEn:
            "Meet engineers in the field, ask direct questions, and discover what work after graduation can look like.",
          descriptionNl:
            "Ontmoet ingenieurs uit het werkveld, stel directe vragen en ontdek hoe werk na je afstuderen eruit kan zien.",
          location: "Campus Arenberg",
          locationEn: "Campus Arenberg",
          locationNl: "Campus Arenberg",
          startAt: daysFromNow(21, 19),
        },
        {
          title: "Study Brunch",
          titleEn: "Study Brunch",
          titleNl: "Studiebrunch",
          slug: slugify("Study Brunch"),
          summary: "Coffee, breakfast, and a calm room to get through the heavy chapters.",
          summaryEn: "Coffee, breakfast, and a calm room to get through the heavy chapters.",
          summaryNl: "Koffie, ontbijt en een rustige ruimte om door de stevige hoofdstukken te raken.",
          description:
            "Bring your course material, settle in with other students, and work through questions together.",
          descriptionEn:
            "Bring your course material, settle in with other students, and work through questions together.",
          descriptionNl:
            "Breng je cursusmateriaal mee, zet je bij andere studenten en werk samen door vragen.",
          location: "Thermotechnisch Instituut",
          locationEn: "Thermotechnisch Instituut",
          locationNl: "Thermotechnisch Instituut",
          startAt: daysFromNow(35, 10),
        },
        {
          title: "Lab Visit",
          titleEn: "Lab Visit",
          titleNl: "Labobezoek",
          slug: slugify("Lab Visit"),
          summary: "A behind-the-scenes visit to research labs on campus.",
          summaryEn: "A behind-the-scenes visit to research labs on campus.",
          summaryNl: "Een blik achter de schermen in onderzoekslabo's op de campus.",
          description:
            "Explore current research, meet doctoral students, and see where chemical engineering gets hands-on.",
          descriptionEn:
            "Explore current research, meet doctoral students, and see where chemical engineering gets hands-on.",
          descriptionNl:
            "Ontdek lopend onderzoek, ontmoet doctoraatsstudenten en zie waar chemische technologie tastbaar wordt.",
          location: "Department labs",
          locationEn: "Department labs",
          locationNl: "Departementslabo's",
          startAt: daysFromNow(49, 17),
        },
        {
          title: "Welcome Drink",
          titleEn: "Welcome Drink",
          titleNl: "Welcomedrink",
          slug: slugify("Welcome Drink"),
          summary: "A relaxed start to the semester with familiar and new faces.",
          summaryEn: "A relaxed start to the semester with familiar and new faces.",
          summaryNl: "Een ontspannen start van het semester met bekende en nieuwe gezichten.",
          description:
            "A low-threshold evening for students to meet the team, find out what is planned, and get to know each other.",
          descriptionEn:
            "A low-threshold evening for students to meet the team, find out what is planned, and get to know each other.",
          descriptionNl:
            "Een laagdrempelige avond waarop studenten de ploeg leren kennen, ontdekken wat gepland staat en elkaar ontmoeten.",
          location: "Theokot",
          locationEn: "Theokot",
          locationNl: "Theokot",
          startAt: daysFromNow(-30, 20),
        },
        {
          title: "Alumni Panel",
          titleEn: "Alumni Panel",
          titleNl: "Alumnipanel",
          slug: slugify("Alumni Panel"),
          summary: "Graduates shared what surprised them most after leaving campus.",
          summaryEn: "Graduates shared what surprised them most after leaving campus.",
          summaryNl: "Afgestudeerden vertelden wat hen het meest verraste na hun studententijd.",
          description:
            "A panel conversation about first jobs, research tracks, consulting, and the messy choices in between.",
          descriptionEn:
            "A panel conversation about first jobs, research tracks, consulting, and the messy choices in between.",
          descriptionNl:
            "Een panelgesprek over eerste jobs, onderzoekstrajecten, consultancy en alle keuzes daartussen.",
          location: "Aula Arenberg",
          locationEn: "Aula Arenberg",
          locationNl: "Aula Arenberg",
          startAt: daysFromNow(-58, 19),
        },
        {
          title: "Board Game Evening",
          titleEn: "Board Game Evening",
          titleNl: "Bordspelavond",
          slug: slugify("Board Game Evening"),
          summary: "A cozy evening away from deadlines.",
          summaryEn: "A cozy evening away from deadlines.",
          summaryNl: "Een gezellige avond weg van deadlines.",
          description:
            "Students brought their favorite games, snacks were shared, and no one talked about exam schedules for at least ten minutes.",
          descriptionEn:
            "Students brought their favorite games, snacks were shared, and no one talked about exam schedules for at least ten minutes.",
          descriptionNl:
            "Studenten brachten hun favoriete spellen mee, snacks werden gedeeld en niemand sprak minstens tien minuten over examenroosters.",
          location: "VTK rooms",
          locationEn: "VTK rooms",
          locationNl: "VTK lokalen",
          startAt: daysFromNow(-90, 20),
        },
      ],
    });
  }

  if (partnerCount === 0) {
    await prisma.partner.createMany({
      data: [
        {
          name: "VTK",
          nameEn: "VTK",
          nameNl: "VTK",
          websiteUrl: "https://vtk.be",
          sortOrder: 1,
        },
        {
          name: "KU Leuven",
          nameEn: "KU Leuven",
          nameNl: "KU Leuven",
          websiteUrl: "https://www.kuleuven.be",
          sortOrder: 2,
        },
      ],
    });
  }
}

async function main() {
  await seedAdmin();
  await seedSettings();
  await seedSections();
  await seedAcademicYears();
  await seedContent();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
