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
import { localized, type PublicLocale, uiText } from "@/lib/i18n";
import type { getSiteData } from "@/lib/site";

type SiteData = Awaited<ReturnType<typeof getSiteData>>;

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
        } as React.CSSProperties
      }
      className="min-h-screen bg-[var(--background)] text-[var(--text)]"
    >
      <Header name={headerName} logo={logo} locale={locale} />

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
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
              {localized(
                locale,
                settings.heroEyebrowEn,
                settings.heroEyebrowNl,
                settings.heroEyebrow,
              )}
            </p>
            <h1 className="text-5xl font-semibold leading-[0.98] sm:text-7xl lg:text-8xl">
              {localized(
                locale,
                settings.heroTitleEn,
                settings.heroTitleNl,
                settings.heroTitle,
              )}
            </h1>
            {localized(
              locale,
              settings.heroSloganEn,
              settings.heroSloganNl,
              settings.heroSlogan ?? "",
            ) ? (
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">
                {localized(
                  locale,
                  settings.heroSloganEn,
                  settings.heroSloganNl,
                  settings.heroSlogan ?? "",
                )}
              </p>
            ) : null}
            {heroButtonText && settings.heroButtonUrl ? (
              <Link
                href={localizeHref(settings.heroButtonUrl, locale)}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#1f1f1f] transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {heroButtonText}
                <ArrowUpRight size={18} />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <Section
        id="about"
        eyebrow={text.about}
        title={localized(
          locale,
          settings.aboutTitleEn,
          settings.aboutTitleNl,
          settings.aboutTitle,
        )}
      >
        <div className="max-w-3xl text-2xl leading-10 text-[var(--muted)]">
          {localized(
            locale,
            settings.aboutTextEn,
            settings.aboutTextNl,
            settings.aboutText,
          )}
        </div>
      </Section>

      <Section id="team" eyebrow={text.people} title={text.team}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {teamMembers.map((member) => (
            <a
              key={member.id}
              href={member.url || localizeHref("#team", locale)}
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
                  <div className="grid h-full place-items-center text-4xl font-semibold text-[var(--primary)]">
                    {member.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{member.name}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
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

      <Section id="events" eyebrow={text.agenda} title={text.events}>
        <EventGroup title={text.upcoming} events={upcomingEvents} locale={locale} />
        <div className="mt-12">
          <EventGroup title={text.previous} events={previousEvents} locale={locale} />
        </div>
      </Section>

      <Section
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
            {localized(
              locale,
              settings.contactTextEn,
              settings.contactTextNl,
              settings.contactText ?? "",
            ) ? (
              <p className="max-w-2xl text-xl leading-9 text-[var(--muted)]">
                {localized(
                  locale,
                  settings.contactTextEn,
                  settings.contactTextNl,
                  settings.contactText ?? "",
                )}
              </p>
            ) : null}
            <a
              href={`mailto:${settings.contactEmail}`}
              className="mt-8 inline-flex items-center gap-3 text-3xl font-semibold underline decoration-[var(--accent)] decoration-4 underline-offset-8"
            >
              <Mail size={30} />
              {settings.contactEmail}
            </a>
          </div>
          <div className="grid gap-3">
            <SocialLink href={settings.facebookUrl} label="Facebook" icon="facebook" />
            <SocialLink href={settings.instagramUrl} label="Instagram" icon="instagram" />
            <SocialLink href={settings.linkedinUrl} label="LinkedIn" icon="linkedin" />
          </div>
        </div>
      </Section>

      <Section id="partners" eyebrow={text.partners} title={text.partners}>
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
                  <span className="text-xl font-semibold">{partnerName}</span>
                )}
              </a>
            );
          })}
        </div>
      </Section>

      <footer className="px-4 py-10 text-center text-sm text-[var(--muted)] sm:px-8">
        {siteName} - {text.managedWith}
      </footer>
    </main>
  );
}

function Header({
  name,
  logo,
  locale,
}: {
  name: string;
  logo: string | null;
  locale: PublicLocale;
}) {
  const text = uiText[locale];

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-black/10 bg-white/88 px-4 py-2.5 text-[var(--text)] shadow-sm shadow-black/5 backdrop-blur-md sm:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          href={localizeHref("/", locale)}
          className="flex min-w-0 items-center gap-3 font-semibold"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-lg text-[var(--primary)] shadow-sm ring-1 ring-black/10 sm:h-14 sm:w-14">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-full w-full object-cover" />
            ) : (
              name.slice(0, 1)
            )}
          </span>
          <span className="truncate text-lg sm:text-xl">{name}</span>
        </Link>
        <div className="hidden items-center gap-5 text-sm font-medium text-[var(--muted)] md:flex">
          <Link href={localizeHref("#about", locale)}>{text.about}</Link>
          <Link href={localizeHref("#team", locale)}>{text.team}</Link>
          <Link href={localizeHref("#events", locale)}>{text.events}</Link>
          <Link href={localizeHref("#contact", locale)}>{text.contact}</Link>
          <Link href={localizeHref("#partners", locale)}>{text.partners}</Link>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-black/10 bg-[var(--background)]/75 p-1 text-xs font-semibold text-[var(--muted)] shadow-sm">
          <Languages size={15} className="ml-2 opacity-75" />
          <Link
            href="/?lang=en"
            className={`rounded-full px-2.5 py-1 ${locale === "en" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)]"}`}
          >
            EN
          </Link>
          <Link
            href="/?lang=nl"
            className={`rounded-full px-2.5 py-1 ${locale === "nl" ? "bg-[var(--primary)] text-white" : "text-[var(--muted)]"}`}
          >
            NL
          </Link>
        </div>
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
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          {eyebrow}
        </p>
        <h2 className="mb-10 text-4xl font-semibold sm:text-6xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function EventGroup({
  title,
  events,
  locale,
}: {
  title: string;
  events: SiteData["events"];
  locale: PublicLocale;
}) {
  const text = uiText[locale];

  if (events.length === 0) {
    return (
      <div>
        <h3 className="mb-4 text-2xl font-semibold">{title}</h3>
        <p className="rounded-3xl bg-[var(--surface)] p-6 text-[var(--muted)]">
          {text.nothingYet}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-2xl font-semibold">{title}</h3>
      <div className="grid gap-4 xl:grid-cols-3">
        {events.map((event) => {
          const eventTitle = localized(locale, event.titleEn, event.titleNl, event.title);

          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}?lang=${locale}`}
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
                  <div className="grid h-full place-items-center p-6 text-center text-xl font-semibold text-[var(--primary)]">
                    {eventTitle}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h4 className="text-xl font-semibold">{eventTitle}</h4>
                {localized(locale, event.summaryEn, event.summaryNl, event.summary ?? "") ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                    {localized(locale, event.summaryEn, event.summaryNl, event.summary ?? "")}
                  </p>
                ) : null}
                <div className="mt-5 grid gap-2 text-sm text-[var(--muted)]">
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

function localizeHref(href: string, locale: PublicLocale) {
  if (href.startsWith("http") || href.startsWith("mailto:")) return href;
  if (href.startsWith("#")) return `/?lang=${locale}${href}`;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}lang=${locale}`;
}
