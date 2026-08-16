import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ChevronLeft } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { PhotoGallery } from "@/components/photo-gallery";
import { SiteHeader } from "@/components/site-header";
import { formatAlbumDate } from "@/lib/format";
import {
  localized,
  localizedOptional,
  localizeHref,
  resolveLocale,
  uiText,
} from "@/lib/i18n";
import { getSiteData } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const getPublishedAlbum = cache((slug: string) =>
  prisma.photoAlbum.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleNl: true,
      descriptionEn: true,
      descriptionNl: true,
      takenOn: true,
      photos: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          width: true,
          height: true,
          originalName: true,
        },
      },
    },
  }),
);

const getMetadataSettings = cache(() =>
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
);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [album, settings] = await Promise.all([
    getPublishedAlbum(slug),
    getMetadataSettings(),
  ]);

  if (!album || !settings) return {};

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

  return {
    title: `${localized(locale, album.titleEn, album.titleNl)} | ${siteName}`,
    description:
      localizedOptional(locale, album.descriptionEn, album.descriptionNl) ||
      undefined,
  };
}

export default async function AlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [data, album] = await Promise.all([
    getSiteData(),
    getPublishedAlbum(slug),
  ]);

  if (!album) notFound();

  const locale = resolveLocale(
    query.lang,
    data.settings.defaultLocale,
    data.settings.languageMode,
  );
  const text = uiText[locale];
  const title = localized(locale, album.titleEn, album.titleNl);
  const description = localizedOptional(
    locale,
    album.descriptionEn,
    album.descriptionNl,
  );
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
      <SiteHeader
        data={data}
        locale={locale}
        currentPath={`/photos/${album.slug}`}
      />

      <article className="px-4 pb-24 pt-32 sm:px-8 sm:pt-36 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <Link
            href={localizeHref("/photos", locale, data.settings.languageMode)}
            className="site-text-sm inline-flex items-center gap-1.5 font-semibold text-[var(--primary)] transition hover:gap-2.5"
          >
            <ChevronLeft size={16} />
            {text.backToAlbums}
          </Link>

          <header className="mt-6 max-w-4xl">
            <h1 className="site-detail-title font-semibold leading-[1.04]">
              {title}
            </h1>
            <p className="site-text-sm mt-4 font-semibold text-[var(--muted)]">
              {album.photos.length}{" "}
              {album.photos.length === 1 ? text.singlePhoto : text.photoCount}
              {album.takenOn
                ? ` · ${formatAlbumDate(
                    album.takenOn,
                    locale === "nl" ? "nl-BE" : "en-GB",
                  )}`
                : ""}
            </p>
            {description ? (
              <MarkdownContent
                headingOffset={2}
                className="site-detail-summary mt-6 text-[var(--muted)]"
              >
                {description}
              </MarkdownContent>
            ) : null}
          </header>

          <div className="mt-10">
            {album.photos.length === 0 ? (
              <p className="rounded-3xl bg-[var(--surface)] p-6 text-[var(--muted)]">
                {text.emptyAlbum}
              </p>
            ) : (
              <PhotoGallery
                photos={album.photos}
                labels={{
                  open: text.openPhoto,
                  close: text.closePhoto,
                  previous: text.previousPhoto,
                  next: text.nextPhoto,
                }}
              />
            )}
          </div>
        </div>
      </article>

      <footer className="site-text-sm px-4 py-10 text-center text-[var(--muted)] sm:px-8">
        {siteName} - {text.managedWith}
      </footer>
    </main>
  );
}
