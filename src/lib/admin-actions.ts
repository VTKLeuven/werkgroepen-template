"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/format";
import { saveUploadedImage } from "@/lib/media";
import { prisma } from "@/lib/prisma";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableValue(formData: FormData, key: string) {
  const input = value(formData, key);
  return input.length > 0 ? input : null;
}

function intValue(formData: FormData, key: string) {
  const input = Number.parseInt(value(formData, key), 10);
  return Number.isFinite(input) ? input : 0;
}

function dateValue(formData: FormData, key: string) {
  const input = value(formData, key);
  return input ? new Date(input) : null;
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

  const logo = await saveUploadedImage(
    formData.get("logo") as File | null,
    `${value(formData, "siteNameEn")} logo`,
  );
  const hero = await saveUploadedImage(
    formData.get("hero") as File | null,
    `${value(formData, "siteNameEn")} hero`,
  );
  const defaultLocale = value(formData, "defaultLocale") === "nl" ? "nl" : "en";

  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: {
      defaultLocale,
      siteName: value(formData, "siteNameEn"),
      siteNameEn: value(formData, "siteNameEn"),
      siteNameNl: value(formData, "siteNameNl"),
      headerName: value(formData, "headerNameEn"),
      headerNameEn: value(formData, "headerNameEn"),
      headerNameNl: value(formData, "headerNameNl"),
      heroEyebrow: value(formData, "heroEyebrowEn"),
      heroEyebrowEn: value(formData, "heroEyebrowEn"),
      heroEyebrowNl: value(formData, "heroEyebrowNl"),
      heroTitle: value(formData, "heroTitleEn"),
      heroTitleEn: value(formData, "heroTitleEn"),
      heroTitleNl: value(formData, "heroTitleNl"),
      heroSlogan: nullableValue(formData, "heroSloganEn"),
      heroSloganEn: nullableValue(formData, "heroSloganEn"),
      heroSloganNl: nullableValue(formData, "heroSloganNl"),
      heroButtonText: nullableValue(formData, "heroButtonTextEn"),
      heroButtonTextEn: nullableValue(formData, "heroButtonTextEn"),
      heroButtonTextNl: nullableValue(formData, "heroButtonTextNl"),
      heroButtonUrl: nullableValue(formData, "heroButtonUrl"),
      aboutTitle: value(formData, "aboutTitleEn"),
      aboutTitleEn: value(formData, "aboutTitleEn"),
      aboutTitleNl: value(formData, "aboutTitleNl"),
      aboutText: value(formData, "aboutTextEn"),
      aboutTextEn: value(formData, "aboutTextEn"),
      aboutTextNl: value(formData, "aboutTextNl"),
      contactTitle: value(formData, "contactTitleEn"),
      contactTitleEn: value(formData, "contactTitleEn"),
      contactTitleNl: value(formData, "contactTitleNl"),
      contactText: nullableValue(formData, "contactTextEn"),
      contactTextEn: nullableValue(formData, "contactTextEn"),
      contactTextNl: nullableValue(formData, "contactTextNl"),
      contactEmail: value(formData, "contactEmail"),
      facebookUrl: nullableValue(formData, "facebookUrl"),
      instagramUrl: nullableValue(formData, "instagramUrl"),
      linkedinUrl: nullableValue(formData, "linkedinUrl"),
      ...(logo ? { logoMediaId: logo.id } : {}),
      ...(hero ? { heroMediaId: hero.id } : {}),
    },
    create: {
      id: "site",
      defaultLocale,
      siteName: value(formData, "siteNameEn"),
      siteNameEn: value(formData, "siteNameEn"),
      siteNameNl: value(formData, "siteNameNl"),
      headerName: value(formData, "headerNameEn"),
      headerNameEn: value(formData, "headerNameEn"),
      headerNameNl: value(formData, "headerNameNl"),
      heroEyebrow: value(formData, "heroEyebrowEn"),
      heroEyebrowEn: value(formData, "heroEyebrowEn"),
      heroEyebrowNl: value(formData, "heroEyebrowNl"),
      heroTitle: value(formData, "heroTitleEn"),
      heroTitleEn: value(formData, "heroTitleEn"),
      heroTitleNl: value(formData, "heroTitleNl"),
      heroSlogan: nullableValue(formData, "heroSloganEn"),
      heroSloganEn: nullableValue(formData, "heroSloganEn"),
      heroSloganNl: nullableValue(formData, "heroSloganNl"),
      heroButtonText: nullableValue(formData, "heroButtonTextEn"),
      heroButtonTextEn: nullableValue(formData, "heroButtonTextEn"),
      heroButtonTextNl: nullableValue(formData, "heroButtonTextNl"),
      heroButtonUrl: nullableValue(formData, "heroButtonUrl"),
      aboutTitle: value(formData, "aboutTitleEn"),
      aboutTitleEn: value(formData, "aboutTitleEn"),
      aboutTitleNl: value(formData, "aboutTitleNl"),
      aboutText: value(formData, "aboutTextEn"),
      aboutTextEn: value(formData, "aboutTextEn"),
      aboutTextNl: value(formData, "aboutTextNl"),
      contactTitle: value(formData, "contactTitleEn"),
      contactTitleEn: value(formData, "contactTitleEn"),
      contactTitleNl: value(formData, "contactTitleNl"),
      contactText: nullableValue(formData, "contactTextEn"),
      contactTextEn: nullableValue(formData, "contactTextEn"),
      contactTextNl: nullableValue(formData, "contactTextNl"),
      contactEmail: value(formData, "contactEmail"),
      facebookUrl: nullableValue(formData, "facebookUrl"),
      instagramUrl: nullableValue(formData, "instagramUrl"),
      linkedinUrl: nullableValue(formData, "linkedinUrl"),
      logoMediaId: logo?.id,
      heroMediaId: hero?.id,
    },
  });

  await prisma.themeSettings.upsert({
    where: { id: "theme" },
    update: {
      backgroundColor: value(formData, "backgroundColor"),
      surfaceColor: value(formData, "surfaceColor"),
      textColor: value(formData, "textColor"),
      mutedColor: value(formData, "mutedColor"),
      primaryColor: value(formData, "primaryColor"),
      accentColor: value(formData, "accentColor"),
      headerColor: value(formData, "headerColor"),
    },
    create: {
      id: "theme",
      backgroundColor: value(formData, "backgroundColor"),
      surfaceColor: value(formData, "surfaceColor"),
      textColor: value(formData, "textColor"),
      mutedColor: value(formData, "mutedColor"),
      primaryColor: value(formData, "primaryColor"),
      accentColor: value(formData, "accentColor"),
      headerColor: value(formData, "headerColor"),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function saveTeamMember(formData: FormData) {
  await requireAdmin();

  const id = nullableValue(formData, "id");
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
    functionName: value(formData, "functionNameEn"),
    functionNameEn: value(formData, "functionNameEn"),
    functionNameNl: value(formData, "functionNameNl"),
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

  await prisma.academicYear.upsert({
    where: { label },
    update: {},
    create: {
      label,
      sortOrder: intValue(formData, "sortOrder"),
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

export async function saveEvent(formData: FormData) {
  await requireAdmin();

  const id = nullableValue(formData, "id");
  const title = value(formData, "titleEn");
  const picture = await saveUploadedImage(
    formData.get("picture") as File | null,
    title,
  );
  const slug = nullableValue(formData, "slug") ?? slugify(title);
  const startAt = dateValue(formData, "startAt") ?? new Date();
  const endAt = dateValue(formData, "endAt");
  const data = {
    title,
    titleEn: value(formData, "titleEn"),
    titleNl: value(formData, "titleNl"),
    slug,
    summary: nullableValue(formData, "summaryEn"),
    summaryEn: nullableValue(formData, "summaryEn"),
    summaryNl: nullableValue(formData, "summaryNl"),
    description: value(formData, "descriptionEn"),
    descriptionEn: value(formData, "descriptionEn"),
    descriptionNl: value(formData, "descriptionNl"),
    location: value(formData, "locationEn"),
    locationEn: value(formData, "locationEn"),
    locationNl: value(formData, "locationNl"),
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
  const logo = await saveUploadedImage(
    formData.get("logo") as File | null,
    value(formData, "nameEn"),
  );
  const data = {
    name: value(formData, "nameEn"),
    nameEn: value(formData, "nameEn"),
    nameNl: value(formData, "nameNl"),
    websiteUrl: value(formData, "websiteUrl"),
    sortOrder: intValue(formData, "sortOrder"),
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
