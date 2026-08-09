import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MarkdownContent } from "@/components/markdown-content";
import { CustomPageCover } from "@/components/custom-page-cover";
import { SiteHeader } from "@/components/site-header";
import { mediaUrl } from "@/lib/format";
import {
  localized,
  localizedOptional,
  resolveLocale,
  uiText,
} from "@/lib/i18n";
import { getSiteData } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const getPublishedCustomPage = cache((slug: string) =>
  prisma.customPage.findFirst({
    where: { slug, isPublished: true },
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
  const [page, settings] = await Promise.all([
    getPublishedCustomPage(slug),
    getMetadataSettings(),
  ]);

  if (!page || !settings) return {};

  const locale = resolveLocale(
    query.lang,
    settings.defaultLocale,
    settings.languageMode,
  );
  const pageTitle = localized(locale, page.titleEn, page.titleNl);
  const siteName = localized(
    locale,
    settings.siteNameEn,
    settings.siteNameNl,
    settings.siteName,
  );
  const description = localizedOptional(
    locale,
    page.supportingTextEn,
    page.supportingTextNl,
  );

  return {
    title: `${pageTitle} | ${siteName}`,
    description: description || undefined,
  };
}

export default async function CustomPageRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [data, page] = await Promise.all([
    getSiteData(),
    getPublishedCustomPage(slug),
  ]);

  if (!page) notFound();

  const locale = resolveLocale(
    query.lang,
    data.settings.defaultLocale,
    data.settings.languageMode,
  );
  const title = localized(locale, page.titleEn, page.titleNl);
  const eyebrow = localizedOptional(locale, page.eyebrowEn, page.eyebrowNl);
  const supportingText = localizedOptional(
    locale,
    page.supportingTextEn,
    page.supportingTextNl,
  );
  const content = localizedOptional(locale, page.contentEn, page.contentNl);
  const cover = mediaUrl(page.coverMediaId);
  const siteName = localized(
    locale,
    data.settings.siteNameEn,
    data.settings.siteNameNl,
    data.settings.siteName,
  );
  const coverElement = cover ? (
    <CustomPageCover
      src={cover}
      alt={title}
      mode={page.coverDisplayMode}
      width={page.coverWidth}
      positionX={page.coverPositionX}
      positionY={page.coverPositionY}
      zoom={page.coverZoom}
      borderWidth={page.coverBorderWidth}
      borderStyle={page.coverBorderStyle}
      borderColor={page.coverBorderColor}
      borderRadius={page.coverBorderRadius}
      shadow={page.coverFrameShadow}
      frameShape={page.coverPlacement === "above" ? "wide" : "side"}
    />
  ) : null;
  const contentElement = content ? (
    <MarkdownContent className="site-page-content max-w-4xl">
      {content}
    </MarkdownContent>
  ) : null;

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
        currentPath={`/pages/${page.slug}`}
      />

      <article className="px-4 pb-24 pt-32 sm:px-8 sm:pt-36 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <header className="max-w-4xl">
            {eyebrow ? (
              <p className="site-text-sm mb-4 font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="site-detail-title font-semibold leading-[1.04]">
              {title}
            </h1>
            {supportingText ? (
              <p className="site-detail-summary mt-6 whitespace-pre-line text-[var(--muted)]">
                {supportingText}
              </p>
            ) : null}
          </header>

          {coverElement && page.coverPlacement !== "above" ? (
            <div
              data-cover-placement={page.coverPlacement}
              className="custom-page-side-layout mt-12 items-start gap-8 lg:gap-12"
              style={
                {
                  "--cover-side-width": `${page.coverSideWidth}%`,
                  "--cover-content-width": `${100 - page.coverSideWidth}%`,
                } as React.CSSProperties
              }
            >
              <div
                className={
                  page.coverPlacement === "right" ? "lg:order-2" : undefined
                }
              >
                {coverElement}
              </div>
              {contentElement ?? (
                <div aria-hidden="true" className="hidden lg:block" />
              )}
            </div>
          ) : (
            <>
              {coverElement ? <div className="mt-10">{coverElement}</div> : null}
              {contentElement ? (
                <div className="mt-12">{contentElement}</div>
              ) : null}
            </>
          )}
        </div>
      </article>

      <footer className="site-text-sm px-4 py-10 text-center text-[var(--muted)] sm:px-8">
        {siteName} - {uiText[locale].managedWith}
      </footer>
    </main>
  );
}
