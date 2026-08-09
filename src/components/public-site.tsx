import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Camera,
  Contact,
  Languages,
  Mail,
  MapPin,
  MessagesSquare,
} from "lucide-react";
import { formatEventDate, mediaUrl } from "@/lib/format";
import {
  isMultilingual,
  localized,
  localizeHref,
  type PublicLocale,
  uiText,
} from "@/lib/i18n";
import type { getSiteData } from "@/lib/site";

type SiteData = Awaited<ReturnType<typeof getSiteData>>;
type SectionKey = SiteData["sections"][number]["key"];
type LanguageMode = SiteData["settings"]["languageMode"];
type LogoMode = SiteData["settings"]["logoMode"];

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
  const logo = mediaUrl(settings.logoMediaId);
  const siteName = localized(
    locale,
    settings.siteNameEn,
    settings.siteNameNl,
    settings.siteName,
  );
  const headerName = localized(
    locale,
    settings.headerNameEn,
    settings.headerNameNl,
    settings.headerName,
  );
  const heroButtonText = localized(
    locale,
    settings.heroButtonTextEn,
    settings.heroButtonTextNl,
    settings.heroButtonText ?? "",
  );
  const heroEyebrow = localized(
    locale,
    settings.heroEyebrowEn,
    settings.heroEyebrowNl,
    settings.heroEyebrow,
  );
  const heroTitle = localized(
    locale,
    settings.heroTitleEn,
    settings.heroTitleNl,
    settings.heroTitle,
  );
  const heroSlogan = localized(
    locale,
    settings.heroSloganEn,
    settings.heroSloganNl,
    settings.heroSlogan ?? "",
  );
  const contactText = localized(
    locale,
    settings.contactTextEn,
    settings.contactTextNl,
    settings.contactText ?? "",
  );
  const visibleSections = [...data.sections]
    .filter((section) => section.isVisible)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const navigationSections = visibleSections.filter(
    (section) => section.showInNavigation,
  );

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
            <div className="site-about-copy max-w-3xl text-[var(--muted)]">
              {localized(
                locale,
                settings.aboutTextEn,
                settings.aboutTextNl,
                settings.aboutText,
              )}
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
                  <p className="site-contact-copy max-w-2xl text-[var(--muted)]">
                    {contactText}
                  </p>
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
      <Header
        name={headerName}
        logo={logo}
        logoMode={settings.logoMode}
        locale={locale}
        languageMode={settings.languageMode}
        sections={navigationSections}
      />

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
            <p className="site-hero-eyebrow mb-5 font-semibold uppercase tracking-[0.18em] text-white/80">
              {heroEyebrow}
            </p>
            <h1 className="site-hero-title font-semibold leading-[0.98]">
              {heroTitle}
            </h1>
            {heroSlogan ? (
              <p className="site-hero-body mt-7 max-w-2xl leading-relaxed text-white/82">
                {heroSlogan}
              </p>
            ) : null}
            {heroButtonText && settings.heroButtonUrl ? (
              <Link
                href={localizeHref(
                  settings.heroButtonUrl,
                  locale,
                  settings.languageMode,
                )}
                className="site-text-sm mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#1f1f1f] transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {heroButtonText}
                <ArrowUpRight size={18} />
              </Link>
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

function Header({
  name,
  logo,
  logoMode,
  locale,
  languageMode,
  sections,
}: {
  name: string;
  logo: string | null;
  logoMode: LogoMode;
  locale: PublicLocale;
  languageMode: LanguageMode;
  sections: SiteData["sections"];
}) {
  const text = uiText[locale];
  const labels: Record<SectionKey, string> = {
    about: text.about,
    team: text.team,
    events: text.events,
    contact: text.contact,
    partners: text.partners,
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-black/10 bg-[var(--header)] px-4 py-2.5 text-[var(--text)] shadow-sm shadow-black/5 sm:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          href={localizeHref("/", locale, languageMode)}
          aria-label={name}
          className="flex min-w-0 items-center gap-3 font-semibold"
        >
          {logoMode === "wordmark" && logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={name}
              className="h-12 w-auto max-w-[min(55vw,18rem)] object-contain sm:h-14"
            />
          ) : logoMode === "wordmark" ? (
            <span className="site-header-name truncate">{name}</span>
          ) : (
            <>
              <span className="site-logo-icon grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-[var(--primary)] shadow-sm ring-1 ring-black/10 sm:h-14 sm:w-14">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt=""
                    className="h-full w-full object-contain p-1.5"
                  />
                ) : (
                  name.slice(0, 1)
                )}
              </span>
              <span className="site-header-name truncate">{name}</span>
            </>
          )}
        </Link>
        <div className="site-text-sm hidden items-center gap-5 font-medium text-[var(--muted)] md:flex">
          {sections.map((section) => (
            <Link
              key={section.key}
              href={localizeHref(`#${section.key}`, locale, languageMode)}
            >
              {labels[section.key]}
            </Link>
          ))}
        </div>
        {isMultilingual(languageMode) ? (
          <div className="site-text-xs flex items-center gap-1 rounded-full border border-black/10 bg-[var(--background)]/75 p-1 font-semibold text-[var(--muted)] shadow-sm">
            <Languages size={15} className="ml-2 opacity-75" />
            <Link
              href={localizeHref("/", "en", languageMode)}
              hrefLang="en"
              lang="en"
              className={`rounded-full px-2.5 py-1 ${locale === "en" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)]"}`}
            >
              EN
            </Link>
            <Link
              href={localizeHref("/", "nl", languageMode)}
              hrefLang="nl"
              lang="nl"
              className={`rounded-full px-2.5 py-1 ${locale === "nl" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)]"}`}
            >
              NL
            </Link>
          </div>
        ) : null}
      </nav>
    </header>
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
                {localized(locale, event.summaryEn, event.summaryNl, event.summary ?? "") ? (
                  <p className="site-text-sm mt-3 line-clamp-2 leading-relaxed text-[var(--muted)]">
                    {localized(locale, event.summaryEn, event.summaryNl, event.summary ?? "")}
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
