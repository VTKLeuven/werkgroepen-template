import Link from "next/link";
import { Languages } from "lucide-react";
import { MobileSiteMenu } from "@/components/mobile-site-menu";
import { mediaUrl } from "@/lib/format";
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

export function SiteHeader({
  data,
  locale,
  currentPath = "/",
}: {
  data: SiteData;
  locale: PublicLocale;
  currentPath?: string;
}) {
  const { settings } = data;
  const text = uiText[locale];
  const name = localized(
    locale,
    settings.headerNameEn,
    settings.headerNameNl,
    settings.headerName,
  );
  const logo = mediaUrl(settings.logoMediaId);
  const sections = [...data.sections]
    .filter((section) => section.isVisible && section.showInNavigation)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const pages = data.customPages.filter((page) => page.showInNavigation);
  const labels: Record<SectionKey, string> = {
    about: text.about,
    team: text.team,
    events: text.events,
    contact: text.contact,
    partners: text.partners,
  };
  const navigation = (
    <>
      {sections.map((section) => (
        <a
          key={section.key}
          href={localizeHref(
            `/#${section.key}`,
            locale,
            settings.languageMode,
          )}
          className="whitespace-nowrap transition hover:text-[var(--text)]"
        >
          {labels[section.key]}
        </a>
      ))}
      {pages.map((page) => {
        const href = localizeHref(
          `/pages/${page.slug}`,
          locale,
          settings.languageMode,
        );
        return (
          <Link
            key={page.id}
            href={href}
            aria-current={currentPath === `/pages/${page.slug}` ? "page" : undefined}
            className="whitespace-nowrap transition hover:text-[var(--text)] aria-[current=page]:text-[var(--primary)]"
          >
            {localized(locale, page.titleEn, page.titleNl)}
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-black/10 bg-[var(--header)] px-4 py-2.5 text-[var(--text)] shadow-sm shadow-black/5 sm:px-8">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link
          href={localizeHref("/", locale, settings.languageMode)}
          aria-label={name}
          className="flex min-w-0 shrink-0 items-center gap-3 font-semibold"
        >
          {settings.logoMode === "wordmark" && logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={name}
              className="h-12 w-auto max-w-[min(42vw,18rem)] object-contain sm:h-14"
            />
          ) : settings.logoMode === "wordmark" ? (
            <span className="site-header-name max-w-[30vw] truncate">{name}</span>
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
              <span className="site-header-name hidden max-w-48 truncate sm:block">
                {name}
              </span>
            </>
          )}
        </Link>

        <div className="site-text-sm hidden min-w-0 flex-1 items-center justify-end gap-5 overflow-x-auto font-medium text-[var(--muted)] md:flex">
          {navigation}
        </div>

        {isMultilingual(settings.languageMode) ? (
          <div className="site-text-xs flex shrink-0 items-center gap-1 rounded-full border border-black/10 bg-[var(--background)]/75 p-1 font-semibold text-[var(--muted)] shadow-sm">
            <Languages size={15} className="ml-1.5 hidden opacity-75 sm:block" />
            <Link
              href={localizeHref(currentPath, "en", settings.languageMode)}
              hrefLang="en"
              lang="en"
              className={`rounded-full px-2.5 py-1 ${
                locale === "en"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)]"
              }`}
            >
              EN
            </Link>
            <Link
              href={localizeHref(currentPath, "nl", settings.languageMode)}
              hrefLang="nl"
              lang="nl"
              className={`rounded-full px-2.5 py-1 ${
                locale === "nl"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)]"
              }`}
            >
              NL
            </Link>
          </div>
        ) : null}

        {sections.length > 0 || pages.length > 0 ? (
          <MobileSiteMenu>{navigation}</MobileSiteMenu>
        ) : null}
      </nav>
    </header>
  );
}
