import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Camera,
  Contact,
  Mail,
  MapPin,
  MessagesSquare,
} from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { CustomPageCover } from "@/components/custom-page-cover";
import { SiteHeader } from "@/components/site-header";
import { formatEventDate, mediaUrl } from "@/lib/format";
import {
  localized,
  localizedOptional,
  localizeHref,
  type PublicLocale,
  uiText,
} from "@/lib/i18n";
import type { getSiteData } from "@/lib/site";

type SiteData = Awaited<ReturnType<typeof getSiteData>>;
type SectionKey = SiteData["sections"][number]["key"];
type LanguageMode = SiteData["settings"]["languageMode"];

export function PublicSite({
  data,
  locale,
}: {
  data: SiteData;
  locale: PublicLocale;
}) {
  const { settings, theme, teamMembers, events, partners } = data;
  const text = uiText[locale];
  const now = new Date();
  const upcomingEvents = events.filter((event) => event.startAt >= now).slice(0, 3);
  const previousEvents = events
    .filter((event) => event.startAt < now)
    .reverse()
    .slice(0, 3);
  const heroImage = mediaUrl(settings.heroMediaId);
  const aboutImage = mediaUrl(settings.aboutMediaId);
  const siteName = localized(
    locale,
    settings.siteNameEn,
    settings.siteNameNl,
    settings.siteName,
  );
  const heroButtonText = localizedOptional(
    locale,
    settings.heroButtonTextEn,
    settings.heroButtonTextNl,
  );
  const heroEyebrow = localizedOptional(
    locale,
    settings.heroEyebrowEn,
    settings.heroEyebrowNl,
  );
  const heroTitle = localized(
    locale,
    settings.heroTitleEn,
    settings.heroTitleNl,
    settings.heroTitle,
  );
  const heroSlogan = localizedOptional(
    locale,
    settings.heroSloganEn,
    settings.heroSloganNl,
  );
  const contactText = localizedOptional(
    locale,
    settings.contactTextEn,
    settings.contactTextNl,
  );
  const visibleSections = [...data.sections]
    .filter((section) => section.isVisible)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const heroButtonHref = settings.heroButtonUrl
    ? localizeHref(settings.heroButtonUrl, locale, settings.languageMode)
    : "";

  function renderSection(key: SectionKey) {
    switch (key) {
      case "about":
        return (
          <Section
            key={key}
            id="about"
            eyebrow={text.about}
            title={localized(
              locale,
              settings.aboutTitleEn,
              settings.aboutTitleNl,
              settings.aboutTitle,
            )}
          >
            <div
              className={`homepage-about-layout items-start gap-8 lg:gap-12 ${
                aboutImage ? "" : "max-w-3xl"
              }`}
              style={
                aboutImage
                  ? ({
                      "--cover-side-width": `${
                        100 - settings.aboutCoverColumnWidth
                      }%`,
                      "--cover-content-width": `${
                        settings.aboutCoverColumnWidth
                      }%`,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <MarkdownContent
                headingOffset={2}
                className="site-about-copy text-[var(--muted)]"
              >
                {localized(
                  locale,
                  settings.aboutTextEn,
                  settings.aboutTextNl,
                  settings.aboutText,
                )}
              </MarkdownContent>
              {aboutImage ? (
                <CustomPageCover
                  src={aboutImage}
                  alt=""
                  mode={settings.aboutCoverDisplayMode}
                  width={settings.aboutCoverWidth}
                  positionX={settings.aboutCoverPositionX}
                  positionY={settings.aboutCoverPositionY}
                  zoom={settings.aboutCoverZoom}
                  borderWidth={settings.aboutCoverBorderWidth}
                  borderStyle={settings.aboutCoverBorderStyle}
                  borderColor={settings.aboutCoverBorderColor}
                  borderRadius={settings.aboutCoverBorderRadius}
                  shadow={settings.aboutCoverFrameShadow}
                  frameShape="side"
                />
              ) : null}
            </div>
          </Section>
        );
      case "team":
        return (
          <Section key={key} id="team" eyebrow={text.people} title={text.team}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {teamMembers.map((member) => (
                <a
                  key={member.id}
                  href={
                    member.url ||
                    localizeHref("#team", locale, settings.languageMode)
                  }
                  target={member.url ? "_blank" : undefined}
                  rel={member.url ? "noreferrer" : undefined}
                  className="group rounded-2xl bg-[var(--surface)] p-3 shadow-sm outline-none ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <div className="mx-auto aspect-square w-full max-w-28 overflow-hidden rounded-2xl bg-[var(--background)]">
                    {member.imageMediaId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(member.imageMediaId) ?? ""}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="site-card-initial grid h-full place-items-center font-semibold text-[var(--primary)]">
                        {member.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="site-text-sm truncate font-semibold">
                        {member.name}
                      </h3>
                      <p className="site-text-xs mt-0.5 line-clamp-2 leading-relaxed text-[var(--muted)]">
                        {localized(
                          locale,
                          member.functionNameEn,
                          member.functionNameNl,
                          member.functionName,
                        )}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={15}
                      className="mt-0.5 shrink-0 opacity-35 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    />
                  </div>
                </a>
              ))}
            </div>
          </Section>
        );
      case "events":
        return (
          <Section key={key} id="events" eyebrow={text.agenda} title={text.events}>
            <EventGroup
              title={text.upcoming}
              events={upcomingEvents}
              locale={locale}
              languageMode={settings.languageMode}
            />
            <div className="mt-12">
              <EventGroup
                title={text.previous}
                events={previousEvents}
                locale={locale}
                languageMode={settings.languageMode}
              />
            </div>
          </Section>
        );
      case "contact":
        return (
          <Section
            key={key}
            id="contact"
            eyebrow={text.contact}
            title={localized(
              locale,
              settings.contactTitleEn,
              settings.contactTitleNl,
              settings.contactTitle,
            )}
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
              <div>
                {contactText ? (
                  <MarkdownContent
                    headingOffset={2}
                    className="site-contact-copy max-w-2xl text-[var(--muted)]"
                  >
                    {contactText}
                  </MarkdownContent>
                ) : null}
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="site-contact-email mt-8 inline-flex max-w-full items-center gap-3 break-all font-semibold underline decoration-[var(--accent)] decoration-4 underline-offset-8"
                >
                  <Mail size={30} className="shrink-0" />
                  {settings.contactEmail}
                </a>
              </div>
              <div className="grid gap-3">
                <SocialLink
                  href={settings.facebookUrl}
                  label="Facebook"
                  icon="facebook"
                />
                <SocialLink
                  href={settings.instagramUrl}
                  label="Instagram"
                  icon="instagram"
                />
                <SocialLink
                  href={settings.linkedinUrl}
                  label="LinkedIn"
                  icon="linkedin"
                />
              </div>
            </div>
          </Section>
        );
      case "partners":
        return (
          <Section
            key={key}
            id="partners"
            eyebrow={text.partners}
            title={text.partners}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {partners.map((partner) => {
                const partnerName = localized(
                  locale,
                  partner.nameEn,
                  partner.nameNl,
                  partner.name,
                );

                return (
                  <a
                    key={partner.id}
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group grid min-h-36 place-items-center rounded-3xl bg-[var(--surface)] p-6 text-center shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    {partner.logoMediaId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(partner.logoMediaId) ?? ""}
                        alt={partnerName}
                        className="max-h-20 object-contain transition group-hover:scale-105"
                      />
                    ) : (
                      <span className="site-text-xl font-semibold">
                        {partnerName}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </Section>
        );
      default:
        return null;
    }
  }

  return (
    <main
      style={
        {
          "--background": theme.backgroundColor,
          "--surface": theme.surfaceColor,
          "--text": theme.textColor,
          "--muted": theme.mutedColor,
          "--primary": theme.primaryColor,
          "--accent": theme.accentColor,
          "--header": theme.headerColor,
          "--body-font-scale": theme.bodyFontScale,
          "--heading-font-scale": theme.headingFontScale,
          "--hero-title-font-scale": theme.heroTitleFontScale,
          "--hero-body-font-scale": theme.heroBodyFontScale,
        } as React.CSSProperties
      }
      lang={locale}
      className="public-site min-h-screen bg-[var(--background)] text-[var(--text)]"
    >
      <SiteHeader data={data} locale={locale} />

      <section className="relative grid min-h-screen overflow-hidden px-4 pb-16 pt-36 text-white sm:px-8 lg:px-12">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--primary),#263238_55%,var(--accent))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.68),rgba(0,0,0,0.32)_48%,rgba(0,0,0,0.08))]" />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl items-end">
          <div className="max-w-4xl">
            {heroEyebrow ? (
              <p className="site-hero-eyebrow mb-5 font-semibold uppercase tracking-[0.18em] text-white/80">
                {heroEyebrow}
              </p>
            ) : null}
            <h1 className="site-hero-title font-semibold leading-[0.98]">
              {heroTitle}
            </h1>
            {heroSlogan ? (
              <p className="site-hero-body mt-7 max-w-2xl leading-relaxed text-white/82">
                {heroSlogan}
              </p>
            ) : null}
            {heroButtonText && heroButtonHref ? (
              <PublicLink
                href={heroButtonHref}
                className="site-text-sm mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#1f1f1f] transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {heroButtonText}
                <ArrowUpRight size={18} />
              </PublicLink>
            ) : null}
          </div>
        </div>
      </section>

      {visibleSections.map((section) => renderSection(section.key))}

      <footer className="site-text-sm px-4 py-10 text-center text-[var(--muted)] sm:px-8">
        {siteName} - {text.managedWith}
      </footer>
    </main>
  );
}

function PublicLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  if (href.includes("#")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="px-4 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="site-text-sm mb-3 font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          {eyebrow}
        </p>
        <h2 className="site-section-title mb-10 font-semibold">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function EventGroup({
  title,
  events,
  locale,
  languageMode,
}: {
  title: string;
  events: SiteData["events"];
  locale: PublicLocale;
  languageMode: LanguageMode;
}) {
  const text = uiText[locale];

  if (events.length === 0) {
    return (
      <div>
        <h3 className="site-subheading mb-4 font-semibold">{title}</h3>
        <p className="rounded-3xl bg-[var(--surface)] p-6 text-[var(--muted)]">
          {text.nothingYet}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="site-subheading mb-4 font-semibold">{title}</h3>
      <div className="grid gap-4 xl:grid-cols-3">
        {events.map((event) => {
          const eventTitle = localized(locale, event.titleEn, event.titleNl, event.title);

          return (
            <Link
              key={event.id}
              href={localizeHref(
                `/events/${event.slug}`,
                locale,
                languageMode,
              )}
              className="group overflow-hidden rounded-3xl bg-[var(--surface)] shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <div className="aspect-[16/9] bg-[var(--background)]">
                {event.pictureMediaId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(event.pictureMediaId) ?? ""}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="site-text-xl grid h-full place-items-center p-6 text-center font-semibold text-[var(--primary)]">
                    {eventTitle}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h4 className="site-text-xl font-semibold">{eventTitle}</h4>
                {localizedOptional(locale, event.summaryEn, event.summaryNl) ? (
                  <p className="site-text-sm mt-3 line-clamp-2 leading-relaxed text-[var(--muted)]">
                    {localizedOptional(locale, event.summaryEn, event.summaryNl)}
                  </p>
                ) : null}
                <div className="site-text-sm mt-5 grid gap-2 text-[var(--muted)]">
                  <span className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    {formatEventDate(
                      event.startAt,
                      event.endAt,
                      locale === "nl" ? "nl-BE" : "en-GB",
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin size={16} />
                    {localized(
                      locale,
                      event.locationEn,
                      event.locationNl,
                      event.location,
                    )}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href?: string | null;
  label: string;
  icon: "facebook" | "instagram" | "linkedin";
}) {
  if (!href) return null;
  const Icon =
    icon === "facebook"
      ? MessagesSquare
      : icon === "instagram"
        ? Camera
        : Contact;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-3xl bg-[var(--surface)] p-5 font-semibold shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
    >
      <span className="flex items-center gap-3">
        <Icon size={22} />
        {label}
      </span>
      <ArrowUpRight size={20} />
    </a>
  );
}
