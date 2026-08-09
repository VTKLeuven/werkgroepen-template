import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { SiteHeader } from "@/components/site-header";
import { formatEventDate, mediaUrl } from "@/lib/format";
import {
  localized,
  localizedOptional,
  localizeHref,
  resolveLocale,
  uiText,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function EventDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const [event, site] = await Promise.all([
    prisma.event.findUnique({
      where: { slug },
      include: { pictureMedia: true },
    }),
    getSiteData(),
  ]);

  if (!event || !event.isPublished) notFound();

  const image = mediaUrl(event.pictureMediaId);
  const locale = resolveLocale(
    query.lang,
    site.settings.defaultLocale,
    site.settings.languageMode,
  );
  const text = uiText[locale];
  const eventTitle = localized(locale, event.titleEn, event.titleNl, event.title);
  const eventSummary = localizedOptional(
    locale,
    event.summaryEn,
    event.summaryNl,
  );

  return (
    <main
      style={
        {
          "--background": site.theme.backgroundColor,
          "--surface": site.theme.surfaceColor,
          "--text": site.theme.textColor,
          "--muted": site.theme.mutedColor,
          "--primary": site.theme.primaryColor,
          "--accent": site.theme.accentColor,
          "--header": site.theme.headerColor,
          "--body-font-scale": site.theme.bodyFontScale,
          "--heading-font-scale": site.theme.headingFontScale,
          "--hero-title-font-scale": site.theme.heroTitleFontScale,
          "--hero-body-font-scale": site.theme.heroBodyFontScale,
        } as React.CSSProperties
      }
      lang={locale}
      className="public-site min-h-screen bg-[var(--background)] text-[var(--text)]"
    >
      <SiteHeader
        data={site}
        locale={locale}
        currentPath={`/events/${event.slug}`}
      />
      <article className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:px-8 sm:pt-36">
        <a
          href={localizeHref(
            "/#events",
            locale,
            site.settings.languageMode,
          )}
          className="site-text-sm mb-8 inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2 font-semibold shadow-sm ring-1 ring-black/5"
        >
          <ArrowLeft size={16} />
          {text.backToEvents}
        </a>
        <div className="overflow-hidden rounded-[2rem] bg-[var(--surface)] shadow-xl shadow-black/10">
          <div className="grid lg:min-h-[520px] lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative min-h-72 bg-[var(--primary)] lg:min-h-full">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="site-event-image-title grid h-full min-h-72 place-items-center p-8 text-center font-semibold text-white lg:min-h-full">
                  {eventTitle}
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
              <p className="site-text-sm mb-4 font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                {text.events}
              </p>
              <h1 className="site-detail-title font-semibold leading-tight">
                {eventTitle}
              </h1>
              <div className="site-text-base mt-8 grid gap-4 text-[var(--muted)]">
                <span className="flex items-center gap-3">
                  <CalendarDays size={20} />
                  {formatEventDate(
                    event.startAt,
                    event.endAt,
                    locale === "nl" ? "nl-BE" : "en-GB",
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <MapPin size={20} />
                  {localized(locale, event.locationEn, event.locationNl, event.location)}
                </span>
              </div>
              {eventSummary ? (
                <p className="site-detail-summary mt-8 text-[var(--muted)]">
                  {eventSummary}
                </p>
              ) : null}
            </div>
          </div>
          <div className="border-t border-black/10 p-6 sm:p-10 lg:p-12">
            <MarkdownContent className="site-detail-body max-w-3xl">
              {localized(
                locale,
                event.descriptionEn,
                event.descriptionNl,
                event.description,
              )}
            </MarkdownContent>
          </div>
        </div>
      </article>
    </main>
  );
}
