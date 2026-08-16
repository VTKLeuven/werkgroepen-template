import type { Metadata } from "next";
import { cache } from "react";
import { AlbumGrid } from "@/components/album-grid";
import { SiteHeader } from "@/components/site-header";
import { localized, resolveLocale, uiText } from "@/lib/i18n";
import { getSiteData } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const getPublishedAlbums = cache(() =>
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
  }),
);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const [query, settings] = await Promise.all([
    searchParams,
    prisma.siteSettings.findUnique({
      where: { id: "site" },
      select: {
        defaultLocale: true,
        languageMode: true,
        siteName: true,
        siteNameEn: true,
        siteNameNl: true,
      },
    }),
  ]);

  if (!settings) return {};

  const locale = resolveLocale(
    query.lang,
    settings.defaultLocale,
    settings.languageMode,
  );
  const siteName = localized(
    locale,
    settings.siteNameEn,
    settings.siteNameNl,
    settings.siteName,
  );

  return { title: `${uiText[locale].photos} | ${siteName}` };
}

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const [query, data, albums] = await Promise.all([
    searchParams,
    getSiteData(),
    getPublishedAlbums(),
  ]);

  const locale = resolveLocale(
    query.lang,
    data.settings.defaultLocale,
    data.settings.languageMode,
  );
  const text = uiText[locale];
  const siteName = localized(
    locale,
    data.settings.siteNameEn,
    data.settings.siteNameNl,
    data.settings.siteName,
  );

  return (
    <main
      style={
        {
          "--background": data.theme.backgroundColor,
          "--surface": data.theme.surfaceColor,
          "--text": data.theme.textColor,
          "--muted": data.theme.mutedColor,
          "--primary": data.theme.primaryColor,
          "--accent": data.theme.accentColor,
          "--header": data.theme.headerColor,
          "--body-font-scale": data.theme.bodyFontScale,
          "--heading-font-scale": data.theme.headingFontScale,
          "--hero-title-font-scale": data.theme.heroTitleFontScale,
          "--hero-body-font-scale": data.theme.heroBodyFontScale,
        } as React.CSSProperties
      }
      lang={locale}
      className="public-site min-h-screen bg-[var(--background)] text-[var(--text)]"
    >
      <SiteHeader data={data} locale={locale} currentPath="/photos" />

      <section className="px-4 pb-24 pt-32 sm:px-8 sm:pt-36 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="site-text-sm mb-3 font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            {text.albums}
          </p>
          <h1 className="site-detail-title mb-10 font-semibold leading-[1.04]">
            {text.photos}
          </h1>

          {albums.length === 0 ? (
            <p className="rounded-3xl bg-[var(--surface)] p-6 text-[var(--muted)]">
              {text.nothingYet}
            </p>
          ) : (
            <AlbumGrid
              albums={albums}
              locale={locale}
              languageMode={data.settings.languageMode}
            />
          )}
        </div>
      </section>

      <footer className="site-text-sm px-4 py-10 text-center text-[var(--muted)] sm:px-8">
        {siteName} - {text.managedWith}
      </footer>
    </main>
  );
}
