import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { formatEventDate, mediaUrl } from "@/lib/format";
import { localized, normalizeLocale, uiText } from "@/lib/i18n";
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
  const locale = normalizeLocale(query.lang, site.settings.defaultLocale);
  const text = uiText[locale];
  const eventTitle = localized(locale, event.titleEn, event.titleNl, event.title);
  const eventSummary = localized(
    locale,
    event.summaryEn,
    event.summaryNl,
    event.summary ?? "",
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
        } as React.CSSProperties
      }
      className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--text)] sm:px-8"
    >
      <article className="mx-auto max-w-6xl">
        <Link
          href={`/?lang=${locale}#events`}
          className="mb-8 inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5"
        >
          <ArrowLeft size={16} />
          {text.backToEvents}
        </Link>
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
                <div className="grid h-full min-h-72 place-items-center p-8 text-center text-4xl font-semibold text-white lg:min-h-full">
                  {eventTitle}
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                {text.events}
              </p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
                {eventTitle}
              </h1>
              <div className="mt-8 grid gap-4 text-[var(--muted)]">
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
                <p className="mt-8 text-2xl leading-10 text-[var(--muted)]">
                  {eventSummary}
                </p>
              ) : null}
            </div>
          </div>
          <div className="border-t border-black/10 p-6 sm:p-10 lg:p-12">
            <div className="max-w-3xl whitespace-pre-wrap text-lg leading-8">
              {localized(
                locale,
                event.descriptionEn,
                event.descriptionNl,
                event.description,
              )}
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
