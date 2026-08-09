import { SettingsEditor } from "@/components/settings-editor";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin";
import { mediaUrl } from "@/lib/format";
import { localized, resolveLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const [{ settings, theme, sections, customPages }, params, allCustomPages] =
    await Promise.all([
      getSiteData(),
      searchParams,
      prisma.customPage.findMany({
        select: {
          id: true,
          slug: true,
          titleEn: true,
          titleNl: true,
          sortOrder: true,
          isPublished: true,
          showInNavigation: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    ]);
  const adminLocale = resolveLocale(
    undefined,
    settings.defaultLocale,
    settings.languageMode,
  );
  const navigationItems = [
    ...sections.map((section) => ({
      type: "section" as const,
      key: section.key,
      sortOrder: section.sortOrder,
      isVisible: section.isVisible,
      showInNavigation: section.showInNavigation,
    })),
    ...allCustomPages.map((page) => ({
      type: "page" as const,
      id: page.id,
      title: localized(adminLocale, page.titleEn, page.titleNl, page.slug),
      slug: page.slug,
      sortOrder: page.sortOrder,
      isPublished: page.isPublished,
      showInNavigation: page.showInNavigation,
    })),
  ].sort((left, right) => left.sortOrder - right.sortOrder);

  return (
    <AdminShell
      title="Website editor"
      description="Shape the public website, preview the result, then publish your changes."
    >
      <SettingsEditor
        saved={params.saved === "1"}
        initial={{
          languageMode: settings.languageMode,
          defaultLocale: settings.defaultLocale,
          logoMode: settings.logoMode,
          copy: {
            siteName: { en: settings.siteNameEn, nl: settings.siteNameNl },
            headerName: { en: settings.headerNameEn, nl: settings.headerNameNl },
            heroEyebrow: {
              en: settings.heroEyebrowEn,
              nl: settings.heroEyebrowNl,
            },
            heroTitle: { en: settings.heroTitleEn, nl: settings.heroTitleNl },
            heroSlogan: {
              en: settings.heroSloganEn ?? "",
              nl: settings.heroSloganNl ?? "",
            },
            heroButtonText: {
              en: settings.heroButtonTextEn ?? "",
              nl: settings.heroButtonTextNl ?? "",
            },
            aboutTitle: { en: settings.aboutTitleEn, nl: settings.aboutTitleNl },
            aboutText: { en: settings.aboutTextEn, nl: settings.aboutTextNl },
            contactTitle: {
              en: settings.contactTitleEn,
              nl: settings.contactTitleNl,
            },
            contactText: {
              en: settings.contactTextEn ?? "",
              nl: settings.contactTextNl ?? "",
            },
          },
          heroButtonUrl: settings.heroButtonUrl ?? "",
          contactEmail: settings.contactEmail,
          facebookUrl: settings.facebookUrl ?? "",
          instagramUrl: settings.instagramUrl ?? "",
          linkedinUrl: settings.linkedinUrl ?? "",
          logoUrl: mediaUrl(settings.logoMediaId),
          logoName: settings.logoMedia?.originalName ?? null,
          heroUrl: mediaUrl(settings.heroMediaId),
          heroName: settings.heroMedia?.originalName ?? null,
          faviconUrl: mediaUrl(settings.faviconMediaId),
          faviconName: settings.faviconMedia?.originalName ?? null,
          colors: {
            backgroundColor: theme.backgroundColor,
            surfaceColor: theme.surfaceColor,
            textColor: theme.textColor,
            mutedColor: theme.mutedColor,
            primaryColor: theme.primaryColor,
            accentColor: theme.accentColor,
            headerColor: theme.headerColor,
          },
          typography: {
            bodyFontScale: theme.bodyFontScale,
            headingFontScale: theme.headingFontScale,
            heroTitleFontScale: theme.heroTitleFontScale,
            heroBodyFontScale: theme.heroBodyFontScale,
          },
          navigationItems,
          customPageLinks: customPages.map((page) => ({
            title: localized(adminLocale, page.titleEn, page.titleNl, page.slug),
            href: `/pages/${page.slug}`,
          })),
        }}
      />
    </AdminShell>
  );
}
