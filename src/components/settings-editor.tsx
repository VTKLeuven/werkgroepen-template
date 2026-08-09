"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Contact,
  Eye,
  ImageIcon,
  Languages,
  LayoutList,
  Menu,
  Monitor,
  Palette,
  PanelTop,
  Save,
  Smartphone,
  Type,
  type LucideIcon,
} from "lucide-react";
import {
  Field,
  inputClass,
  textareaClass,
} from "@/components/admin-shell";
import { MarkdownContent } from "@/components/markdown-content";
import { MarkdownEditor } from "@/components/markdown-editor";
import { CustomPageCover } from "@/components/custom-page-cover";
import {
  CoverSettingsEditor,
  type CoverSettings,
} from "@/components/cover-settings-editor";
import {
  HeaderNavigationBoard,
  HomepageOrderBoard,
  type EditableNavigationItem,
  type EditableSection,
} from "@/components/section-order-board";
import { updateSettings } from "@/lib/admin-actions";
import {
  heroTextPositionClasses,
  heroTextPositions,
  type HeroTextPosition,
} from "@/lib/hero-layout";

type Locale = "en" | "nl";
type LanguageMode = "bilingual" | "englishOnly" | "dutchOnly";
type LogoMode = "iconWithText" | "wordmark";
type CopyKey =
  | "siteName"
  | "headerName"
  | "heroEyebrow"
  | "heroTitle"
  | "heroSlogan"
  | "heroButtonText"
  | "aboutTitle"
  | "aboutText"
  | "contactTitle"
  | "contactText";

type LocalizedCopy = Record<CopyKey, Record<Locale, string>>;

type EditorInitial = {
  languageMode: LanguageMode;
  defaultLocale: Locale;
  logoMode: LogoMode;
  copy: LocalizedCopy;
  heroButtonUrl: string;
  heroTextPosition: HeroTextPosition;
  contactEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  logoUrl: string | null;
  logoName: string | null;
  heroUrl: string | null;
  heroName: string | null;
  aboutImageUrl: string | null;
  aboutImageName: string | null;
  aboutCover: CoverSettings;
  aboutCoverColumnWidth: number;
  faviconUrl: string | null;
  faviconName: string | null;
  colors: {
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    mutedColor: string;
    primaryColor: string;
    accentColor: string;
    headerColor: string;
  };
  typography: {
    bodyFontScale: number;
    headingFontScale: number;
    heroTitleFontScale: number;
    heroBodyFontScale: number;
  };
  homepageSections: EditableSection[];
  headerNavigationItems: EditableNavigationItem[];
  previewContent: {
    team: { name: string; role: string; imageUrl: string | null }[];
    events: { title: string; imageUrl: string | null }[];
    partners: { name: string; imageUrl: string | null }[];
  };
  customPageLinks: { title: string; href: string }[];
};

export function SettingsEditor({
  initial,
  saved,
}: {
  initial: EditorInitial;
  saved: boolean;
}) {
  const [languageChoice, setLanguageChoice] = useState<"single" | "bilingual">(
    initial.languageMode === "bilingual" ? "bilingual" : "single",
  );
  const [defaultLocale, setDefaultLocale] = useState<Locale>(
    initial.languageMode === "dutchOnly" ? "nl" : initial.defaultLocale,
  );
  const [previewLocale, setPreviewLocale] = useState<Locale>(defaultLocale);
  const [logoMode, setLogoMode] = useState<LogoMode>(initial.logoMode);
  const [heroTextPosition, setHeroTextPosition] = useState(
    initial.heroTextPosition,
  );
  const [copy, setCopy] = useState(initial.copy);
  const [colors, setColors] = useState(initial.colors);
  const [typography, setTypography] = useState(initial.typography);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [heroUrl, setHeroUrl] = useState(initial.heroUrl);
  const [aboutImageUrl, setAboutImageUrl] = useState(initial.aboutImageUrl);
  const [aboutCover, setAboutCover] = useState(initial.aboutCover);
  const [aboutCoverColumnWidth, setAboutCoverColumnWidth] = useState(
    initial.aboutCoverColumnWidth,
  );
  const [faviconUrl, setFaviconUrl] = useState(initial.faviconUrl);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeHero, setRemoveHero] = useState(false);
  const [removeAboutImage, setRemoveAboutImage] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [homepageSections, setHomepageSections] = useState(
    initial.homepageSections,
  );
  const [headerNavigationItems, setHeaderNavigationItems] = useState(
    initial.headerNavigationItems,
  );
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [facebookUrl, setFacebookUrl] = useState(initial.facebookUrl);
  const [instagramUrl, setInstagramUrl] = useState(initial.instagramUrl);
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl);
  const [dirty, setDirty] = useState(false);

  useObjectUrlCleanup(logoUrl);
  useObjectUrlCleanup(heroUrl);
  useObjectUrlCleanup(aboutImageUrl);
  useObjectUrlCleanup(faviconUrl);

  useEffect(() => {
    if (!dirty) return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  const languageMode: LanguageMode =
    languageChoice === "bilingual"
      ? "bilingual"
      : defaultLocale === "nl"
        ? "dutchOnly"
        : "englishOnly";
  const activePreviewLocale =
    languageChoice === "single" ? defaultLocale : previewLocale;
  const visibleAboutImageUrl = removeAboutImage ? null : aboutImageUrl;
  const heroPosition = heroTextPositionClasses(heroTextPosition);

  function updateCopy(key: CopyKey, locale: Locale, nextValue: string) {
    setDirty(true);
    setCopy((current) => ({
      ...current,
      [key]: { ...current[key], [locale]: nextValue },
    }));
  }

  function previewFile(
    file: File | undefined,
    setUrl: Dispatch<SetStateAction<string | null>>,
  ) {
    if (!file) return;
    setUrl(URL.createObjectURL(file));
  }

  function updateHomepageItems(next: EditableSection[]) {
    setHomepageSections(next);
    const visibility = new Map(next.map((section) => [section.key, section.isVisible]));
    setHeaderNavigationItems((current) =>
      current.map((item) => {
        if (item.type !== "section") return item;
        const isVisible = visibility.get(item.key) ?? item.isVisible;
        return {
          ...item,
          isVisible,
          showInNavigation: isVisible ? item.showInNavigation : false,
        };
      }),
    );
  }

  return (
    <form
      action={updateSettings}
      className={`grid items-start gap-6 ${
        showPreview
          ? "xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.72fr)]"
          : "grid-cols-1"
      }`}
      onInput={(event) => {
        if (!(event.target as HTMLElement).closest("[data-auto-save]")) {
          setDirty(true);
        }
      }}
      onChange={(event) => {
        if (!(event.target as HTMLElement).closest("[data-auto-save]")) {
          setDirty(true);
        }
      }}
    >
      <input type="hidden" name="languageMode" value={languageMode} />
      <div className="grid min-w-0 gap-6">
        {saved ? (
          <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Check size={17} />
            Your website settings were saved.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#006d77]/15 bg-[#006d77]/5 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#231f20]">
              Settings are grouped by purpose
            </p>
            <p className="mt-0.5 text-xs text-[#6f6860]">
              Open only what you need. The full-page preview is available on demand.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-[#006d77]/20 bg-white px-4 py-2 text-sm font-semibold text-[#006d77] shadow-sm transition hover:-translate-y-0.5"
          >
            {showPreview ? <Eye size={16} /> : <Monitor size={16} />}
            {showPreview ? "Hide preview" : "Show full preview"}
          </button>
        </div>

        <SettingsSection
          icon={Languages}
          title="Languages"
          description="Choose whether editors manage one public language or English and Dutch side by side."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              checked={languageChoice === "single"}
              name="languageChoice"
              value="single"
              title="One language"
              description="A cleaner editor and no language switch on the website."
              onChange={() => setLanguageChoice("single")}
            />
            <ChoiceCard
              checked={languageChoice === "bilingual"}
              name="languageChoice"
              value="bilingual"
              title="English + Dutch"
              description="Edit both versions and let visitors switch language."
              onChange={() => setLanguageChoice("bilingual")}
            />
          </div>
          <div className="mt-5 max-w-sm">
            <Field
              label={
                languageChoice === "bilingual"
                  ? "Default website language"
                  : "Website language"
              }
            >
              <select
                name="defaultLocale"
                value={defaultLocale}
                className={inputClass}
                onChange={(event) => {
                  const locale = event.target.value as Locale;
                  setDefaultLocale(locale);
                  if (languageChoice === "single") setPreviewLocale(locale);
                }}
              >
                <option value="en">English</option>
                <option value="nl">Dutch</option>
              </select>
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={PanelTop}
          title="Brand and header"
          description="Set the name visitors see and choose how your logo behaves in the header."
        >
          <div className="grid gap-4">
            <LocalizedControl
              label="Website name"
              field="siteName"
              values={copy.siteName}
              languageChoice={languageChoice}
              activeLocale={defaultLocale}
              onChange={(locale, value) => updateCopy("siteName", locale, value)}
              required
            />
            <LocalizedControl
              label="Header text"
              hint="Used next to a square logo and as accessible fallback text."
              field="headerName"
              values={copy.headerName}
              languageChoice={languageChoice}
              activeLocale={defaultLocale}
              onChange={(locale, value) => updateCopy("headerName", locale, value)}
              required
            />

            <fieldset className="mt-2">
              <legend className="text-sm font-semibold text-[#3a352f]">
                Header logo style
              </legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <ChoiceCard
                  checked={logoMode === "iconWithText"}
                  name="logoMode"
                  value="iconWithText"
                  title="Square icon + text"
                  description="A compact badge with the header text beside it."
                  onChange={() => setLogoMode("iconWithText")}
                />
                <ChoiceCard
                  checked={logoMode === "wordmark"}
                  name="logoMode"
                  value="wordmark"
                  title="Full-width logo"
                  description="The uploaded logo already contains its name; no frame or extra text."
                  onChange={() => setLogoMode("wordmark")}
                />
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <MediaField
                label="Header logo"
                name="logo"
                currentName={initial.logoName}
                previewUrl={removeLogo ? null : logoUrl}
                previewContain
                removeName="removeLogo"
                remove={removeLogo}
                onRemove={(checked) => {
                  setRemoveLogo(checked);
                  if (!checked) setLogoUrl(initial.logoUrl);
                }}
                onFile={(file) => {
                  setRemoveLogo(false);
                  previewFile(file, setLogoUrl);
                }}
              />
              <MediaField
                label="Browser icon (favicon)"
                name="favicon"
                currentName={initial.faviconName}
                previewUrl={removeFavicon ? null : faviconUrl}
                previewContain
                accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon,.ico"
                help="A square PNG or ICO works best."
                removeName="removeFavicon"
                remove={removeFavicon}
                onRemove={(checked) => {
                  setRemoveFavicon(checked);
                  if (!checked) setFaviconUrl(initial.faviconUrl);
                }}
                onFile={(file) => {
                  setRemoveFavicon(false);
                  previewFile(file, setFaviconUrl);
                }}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={ImageIcon}
          title="Hero"
          description="The live preview updates while you type and also shows a newly selected photo before saving."
        >
          <div className="grid gap-4">
            <MediaField
              label="Hero photo"
              name="hero"
              currentName={initial.heroName}
              previewUrl={removeHero ? null : heroUrl}
              wide
              removeName="removeHero"
              remove={removeHero}
              onRemove={(checked) => {
                setRemoveHero(checked);
                if (!checked) setHeroUrl(initial.heroUrl);
              }}
              onFile={(file) => {
                setRemoveHero(false);
                previewFile(file, setHeroUrl);
              }}
            />
            <fieldset>
              <legend className="text-sm font-semibold text-[#3a352f]">
                Text position
              </legend>
              <p className="mt-1 text-xs leading-5 text-[#6f6860]">
                Choose where the headline, supporting text, and button sit on
                the hero photo.
              </p>
              <div className="mt-3 grid w-fit grid-cols-3 gap-2 rounded-2xl border border-black/10 bg-[#f5f1e8] p-2">
                {heroTextPositions.map((position) => (
                  <label
                    key={position.value}
                    title={position.label}
                    className={`grid h-11 w-11 cursor-pointer place-items-center rounded-xl border transition ${
                      heroTextPosition === position.value
                        ? "border-[#006d77] bg-white text-[#006d77] shadow-sm ring-2 ring-[#006d77]/15"
                        : "border-black/10 bg-white/55 text-[#9b948a] hover:border-black/20 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="heroTextPosition"
                      value={position.value}
                      checked={heroTextPosition === position.value}
                      onChange={() => setHeroTextPosition(position.value)}
                      aria-label={position.label}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`flex h-6 w-6 rounded-md border border-current/25 p-1 ${
                        heroTextPositionClasses(position.value).container
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold text-[#006d77]">
                {heroTextPositions.find(
                  (position) => position.value === heroTextPosition,
                )?.label}
              </p>
            </fieldset>
            <LocalizedControl
              label="Eyebrow"
              field="heroEyebrow"
              values={copy.heroEyebrow}
              languageChoice={languageChoice}
              activeLocale={defaultLocale}
              onChange={(locale, value) => updateCopy("heroEyebrow", locale, value)}
            />
            <LocalizedControl
              label="Headline"
              field="heroTitle"
              values={copy.heroTitle}
              languageChoice={languageChoice}
              activeLocale={defaultLocale}
              onChange={(locale, value) => updateCopy("heroTitle", locale, value)}
              required
            />
            <LocalizedControl
              label="Supporting text"
              field="heroSlogan"
              values={copy.heroSlogan}
              languageChoice={languageChoice}
              activeLocale={defaultLocale}
              onChange={(locale, value) => updateCopy("heroSlogan", locale, value)}
              multiline
            />
            <LocalizedControl
              label="Button text"
              field="heroButtonText"
              values={copy.heroButtonText}
              languageChoice={languageChoice}
              activeLocale={defaultLocale}
              onChange={(locale, value) =>
                updateCopy("heroButtonText", locale, value)
              }
            />
            <Field label="Button destination">
              <input
                name="heroButtonUrl"
                defaultValue={initial.heroButtonUrl}
                className={inputClass}
                list="hero-destination-options"
                placeholder="#events, /pages/… or https://…"
              />
              <datalist id="hero-destination-options">
                <option value="#about">About section</option>
                <option value="#team">Team section</option>
                <option value="#events">Events section</option>
                <option value="#partners">Partners section</option>
                <option value="#contact">Contact section</option>
                {initial.customPageLinks.map((page) => (
                  <option key={page.href} value={page.href}>
                    {page.title}
                  </option>
                ))}
              </datalist>
              <p className="text-xs font-normal leading-5 text-[#6f6860]">
                Choose a homepage section or published custom page, or paste an
                external URL.
              </p>
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={Contact}
          title="About section"
          description="Edit the homepage introduction and its optional side image."
        >
          <div className="grid gap-4">
            <LocalizedControl
              label="Title"
              field="aboutTitle"
              values={copy.aboutTitle}
              languageChoice={languageChoice}
              activeLocale={defaultLocale}
              onChange={(locale, value) => updateCopy("aboutTitle", locale, value)}
              required
            />
            <LocalizedControl
              label="Text"
              field="aboutText"
              values={copy.aboutText}
              languageChoice={languageChoice}
              activeLocale={defaultLocale}
              onChange={(locale, value) => updateCopy("aboutText", locale, value)}
              markdown
              required
            />
            <MediaField
              label="Image on the right (optional)"
              name="aboutImage"
              currentName={initial.aboutImageName}
              previewUrl={removeAboutImage ? null : aboutImageUrl}
              removeName="removeAboutImage"
              remove={removeAboutImage}
              onRemove={(checked) => {
                setRemoveAboutImage(checked);
                if (!checked) setAboutImageUrl(initial.aboutImageUrl);
              }}
              onFile={(file) => {
                setRemoveAboutImage(false);
                previewFile(file, setAboutImageUrl);
              }}
              help="On phones the image moves below the About text."
            />
            {visibleAboutImageUrl ? (
              <details className="group rounded-2xl border border-black/10 bg-[#faf8f3]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-[#006d77]" />
                    Image appearance
                  </span>
                  <ChevronDown
                    size={17}
                    className="text-[#8b847b] transition group-open:rotate-180"
                  />
                </summary>
                <div className="grid gap-4 border-t border-black/5 p-4">
                  <label className="block max-w-md text-sm font-semibold text-[#3a352f]">
                    <span className="flex items-center justify-between gap-2">
                      Image column width
                      <output>{Math.round(aboutCoverColumnWidth)}%</output>
                    </span>
                    <input
                      name="aboutCoverColumnWidth"
                      type="range"
                      min="30"
                      max="60"
                      step="1"
                      value={aboutCoverColumnWidth}
                      onChange={(event) =>
                        setAboutCoverColumnWidth(Number(event.target.value))
                      }
                      className="mt-2 block w-full accent-[#006d77]"
                    />
                  </label>
                  <CoverSettingsEditor
                    namePrefix="aboutCover"
                    value={aboutCover}
                    onChange={(nextValue) => {
                      setAboutCover(nextValue);
                      setDirty(true);
                    }}
                    previewUrl={visibleAboutImageUrl}
                    previewAlt="About section"
                    frameShape="side"
                  />
                </div>
              </details>
            ) : (
              <HiddenAboutCoverSettings
                cover={aboutCover}
                columnWidth={aboutCoverColumnWidth}
              />
            )}
          </div>
        </SettingsSection>

        <SettingsSection
          icon={Contact}
          title="Contact and social links"
          description="Set the contact copy, email address, and social profiles."
        >
          <div className="grid gap-4">
            <LocalizedControl
              label="Title"
              field="contactTitle"
              values={copy.contactTitle}
              languageChoice={languageChoice}
              activeLocale={defaultLocale}
              onChange={(locale, value) =>
                updateCopy("contactTitle", locale, value)
              }
              required
            />
            <LocalizedControl
              label="Short text"
              field="contactText"
              values={copy.contactText}
              languageChoice={languageChoice}
              activeLocale={defaultLocale}
              onChange={(locale, value) => updateCopy("contactText", locale, value)}
              markdown
            />
            <Field label="Email">
              <input
                name="contactEmail"
                type="email"
                required
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="Facebook URL">
                <input
                  name="facebookUrl"
                  type="url"
                  value={facebookUrl}
                  onChange={(event) => setFacebookUrl(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Instagram URL">
                <input
                  name="instagramUrl"
                  type="url"
                  value={instagramUrl}
                  onChange={(event) => setInstagramUrl(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="LinkedIn URL">
                <input
                  name="linkedinUrl"
                  type="url"
                  value={linkedinUrl}
                  onChange={(event) => setLinkedinUrl(event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={LayoutList}
          title="Homepage sections"
          description="Choose which default sections appear on the homepage and arrange their order."
          badge="Auto-saves"
        >
          <HomepageOrderBoard
            items={homepageSections}
            onItemsChange={updateHomepageItems}
          />
        </SettingsSection>

        <SettingsSection
          icon={Menu}
          title="Header navigation"
          description="Arrange default sections and custom pages together in the website header."
          badge="Auto-saves"
        >
          <HeaderNavigationBoard
            key={headerNavigationItems
              .filter((item) => item.type === "section")
              .map((item) => `${item.key}:${item.isVisible}`)
              .join("|")}
            items={headerNavigationItems}
            onItemsChange={setHeaderNavigationItems}
          />
        </SettingsSection>

        <SettingsSection
          icon={Palette}
          title="Colors and typography"
          description="Use restrained adjustments to keep the layout readable on phones and large screens."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ColorField
              label="Background"
              name="backgroundColor"
              value={colors.backgroundColor}
              onChange={(value) =>
                setColors((current) => ({ ...current, backgroundColor: value }))
              }
            />
            <ColorField
              label="Cards / surfaces"
              name="surfaceColor"
              value={colors.surfaceColor}
              onChange={(value) =>
                setColors((current) => ({ ...current, surfaceColor: value }))
              }
            />
            <ColorField
              label="Text"
              name="textColor"
              value={colors.textColor}
              onChange={(value) =>
                setColors((current) => ({ ...current, textColor: value }))
              }
            />
            <ColorField
              label="Muted text"
              name="mutedColor"
              value={colors.mutedColor}
              onChange={(value) =>
                setColors((current) => ({ ...current, mutedColor: value }))
              }
            />
            <ColorField
              label="Primary"
              name="primaryColor"
              value={colors.primaryColor}
              onChange={(value) =>
                setColors((current) => ({ ...current, primaryColor: value }))
              }
            />
            <ColorField
              label="Accent"
              name="accentColor"
              value={colors.accentColor}
              onChange={(value) =>
                setColors((current) => ({ ...current, accentColor: value }))
              }
            />
            <ColorField
              label="Header"
              name="headerColor"
              value={colors.headerColor}
              onChange={(value) =>
                setColors((current) => ({ ...current, headerColor: value }))
              }
            />
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <ScaleField
              label="Body text"
              name="bodyFontScale"
              value={typography.bodyFontScale}
              onChange={(value) =>
                setTypography((current) => ({ ...current, bodyFontScale: value }))
              }
            />
            <ScaleField
              label="Section headings"
              name="headingFontScale"
              value={typography.headingFontScale}
              onChange={(value) =>
                setTypography((current) => ({
                  ...current,
                  headingFontScale: value,
                }))
              }
            />
            <ScaleField
              label="Hero headline"
              name="heroTitleFontScale"
              value={typography.heroTitleFontScale}
              onChange={(value) =>
                setTypography((current) => ({
                  ...current,
                  heroTitleFontScale: value,
                }))
              }
            />
            <ScaleField
              label="Hero supporting text"
              name="heroBodyFontScale"
              value={typography.heroBodyFontScale}
              onChange={(value) =>
                setTypography((current) => ({
                  ...current,
                  heroBodyFontScale: value,
                }))
              }
            />
          </div>
        </SettingsSection>

        <div
          className={`sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-3xl border p-4 shadow-xl backdrop-blur ${
            dirty
              ? "border-amber-300 bg-amber-50/95 shadow-amber-950/10"
              : "border-emerald-200 bg-white/95 shadow-black/10"
          }`}
        >
          <SaveButton />
          <p
            className={`flex items-center gap-2 text-sm font-semibold ${
              dirty ? "text-amber-900" : "text-emerald-700"
            }`}
          >
            {dirty ? <AlertCircle size={17} /> : <Check size={17} />}
            {dirty
              ? "Unsaved changes — save before leaving this page."
              : "All website settings are saved."}
          </p>
        </div>
      </div>

      {showPreview ? (
      <aside className="min-w-0 xl:sticky xl:top-6">
        <div className="flex max-h-[calc(100vh-3rem)] flex-col rounded-[2rem] bg-[#211f1c] p-3 shadow-xl shadow-black/15">
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 px-2 pt-1 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                Live preview
              </p>
              <p className="text-sm font-semibold">Full homepage</p>
            </div>
            <div className="flex gap-1 rounded-full bg-white/10 p-1">
              <PreviewButton
                active={device === "desktop"}
                label="Desktop preview"
                onClick={() => setDevice("desktop")}
              >
                <Monitor size={15} />
              </PreviewButton>
              <PreviewButton
                active={device === "mobile"}
                label="Mobile preview"
                onClick={() => setDevice("mobile")}
              >
                <Smartphone size={15} />
              </PreviewButton>
            </div>
          </div>

          <div
            className={`mx-auto min-h-0 w-full flex-1 overflow-y-auto overscroll-contain rounded-[1.35rem] bg-white transition-all ${
              device === "mobile" ? "max-w-[290px]" : "max-w-full"
            }`}
          >
            <div
              className="flex h-14 items-center justify-between gap-3 border-b border-black/10 px-3"
              style={{ backgroundColor: colors.headerColor, color: colors.textColor }}
            >
              <PreviewBrand
                logoMode={logoMode}
                logoUrl={removeLogo ? null : logoUrl}
                name={copy.headerName[activePreviewLocale]}
                primaryColor={colors.primaryColor}
              />
              {languageChoice === "bilingual" ? (
                <div className="flex rounded-full bg-black/5 p-0.5 text-[9px] font-bold">
                  {(["en", "nl"] as const).map((locale) => (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => setPreviewLocale(locale)}
                      className={`rounded-full px-2 py-1 uppercase ${
                        activePreviewLocale === locale ? "text-white" : "opacity-55"
                      }`}
                      style={
                        activePreviewLocale === locale
                          ? { backgroundColor: colors.primaryColor }
                          : undefined
                      }
                    >
                      {locale}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div
              className={`relative flex overflow-hidden p-5 text-white ${
                heroPosition.container
              } ${
                device === "mobile" ? "min-h-[390px]" : "min-h-[360px]"
              }`}
              style={{
                background: !removeHero && heroUrl
                  ? undefined
                  : `linear-gradient(135deg, ${colors.primaryColor}, #263238 58%, ${colors.accentColor})`,
              }}
            >
              {!removeHero && heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <div className={`absolute inset-0 ${heroPosition.overlay}`} />
              <div
                className={`relative z-10 w-full max-w-[92%] ${heroPosition.content}`}
              >
                {copy.heroEyebrow[activePreviewLocale] ? (
                  <p
                    className="mb-2 font-semibold uppercase tracking-[0.16em] text-white/75"
                    style={{ fontSize: `${0.64 * typography.heroBodyFontScale}rem` }}
                  >
                    {copy.heroEyebrow[activePreviewLocale]}
                  </p>
                ) : null}
                <h2
                  className="font-semibold leading-[0.98]"
                  style={{
                    fontSize: `${
                      (device === "mobile" ? 2.1 : 2.65) *
                      typography.heroTitleFontScale
                    }rem`,
                  }}
                >
                  {copy.heroTitle[activePreviewLocale] || "Your hero headline"}
                </h2>
                {copy.heroSlogan[activePreviewLocale] ? (
                  <p
                    className={`mt-3 max-w-md leading-relaxed text-white/80 ${heroPosition.copy}`}
                    style={{ fontSize: `${0.76 * typography.heroBodyFontScale}rem` }}
                  >
                    {copy.heroSlogan[activePreviewLocale]}
                  </p>
                ) : null}
                {copy.heroButtonText[activePreviewLocale] ? (
                  <span
                    className="mt-4 inline-flex rounded-full bg-white px-3 py-1.5 font-semibold text-[#1f1f1f]"
                    style={{ fontSize: `${0.66 * typography.bodyFontScale}rem` }}
                  >
                    {copy.heroButtonText[activePreviewLocale]}
                  </span>
                ) : null}
              </div>
            </div>

            {homepageSections
              .filter((section) => section.isVisible)
              .map((section) => (
                <PreviewHomepageSection
                  key={section.key}
                  section={section.key}
                  locale={activePreviewLocale}
                  device={device}
                  copy={copy}
                  colors={colors}
                  typography={typography}
                  aboutImageUrl={visibleAboutImageUrl}
                  aboutCover={aboutCover}
                  aboutCoverColumnWidth={aboutCoverColumnWidth}
                  previewContent={initial.previewContent}
                  contactEmail={contactEmail}
                  socialLinks={{ facebookUrl, instagramUrl, linkedinUrl }}
                />
              ))}
            <div
              className="border-t border-black/10 px-5 py-4 text-center text-[10px]"
              style={{
                backgroundColor: colors.headerColor,
                color: colors.mutedColor,
              }}
            >
              {copy.siteName[activePreviewLocale]} · Full homepage preview
            </div>
          </div>

          <div className="mt-3 flex shrink-0 items-center justify-between gap-3 px-2 pb-1">
            <p className="text-xs leading-5 text-white/55">
              Preview changes are local until you save.
            </p>
            <SaveButton compact />
          </div>
        </div>
      </aside>
      ) : null}
    </form>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 transition hover:bg-black/[0.015] sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#006d77]/8 text-[#006d77]">
          <Icon size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#231f20]">{title}</span>
            {badge ? (
              <span className="rounded-full bg-[#006d77]/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#006d77]">
                {badge}
              </span>
            ) : null}
          </span>
          {description ? (
            <span className="mt-0.5 block text-xs leading-5 text-[#6f6860]">
              {description}
            </span>
          ) : null}
        </span>
        <ChevronDown
          size={19}
          className="shrink-0 text-[#8b847b] transition group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-black/5 p-4 sm:p-5">{children}</div>
    </details>
  );
}

function HiddenAboutCoverSettings({
  cover,
  columnWidth,
}: {
  cover: CoverSettings;
  columnWidth: number;
}) {
  return (
    <>
      <input type="hidden" name="aboutCoverColumnWidth" value={columnWidth} />
      <input type="hidden" name="aboutCoverDisplayMode" value={cover.mode} />
      <input type="hidden" name="aboutCoverWidth" value={cover.width} />
      <input type="hidden" name="aboutCoverPositionX" value={cover.positionX} />
      <input type="hidden" name="aboutCoverPositionY" value={cover.positionY} />
      <input type="hidden" name="aboutCoverZoom" value={cover.zoom} />
      <input type="hidden" name="aboutCoverBorderWidth" value={cover.borderWidth} />
      <input type="hidden" name="aboutCoverBorderStyle" value={cover.borderStyle} />
      <input type="hidden" name="aboutCoverBorderColor" value={cover.borderColor} />
      <input type="hidden" name="aboutCoverBorderRadius" value={cover.borderRadius} />
      <input type="hidden" name="aboutCoverFrameShadow" value={cover.shadow} />
    </>
  );
}

function PreviewHomepageSection({
  section,
  locale,
  device,
  copy,
  colors,
  typography,
  aboutImageUrl,
  aboutCover,
  aboutCoverColumnWidth,
  previewContent,
  contactEmail,
  socialLinks,
}: {
  section: EditableSection["key"];
  locale: Locale;
  device: "desktop" | "mobile";
  copy: LocalizedCopy;
  colors: EditorInitial["colors"];
  typography: EditorInitial["typography"];
  aboutImageUrl: string | null;
  aboutCover: CoverSettings;
  aboutCoverColumnWidth: number;
  previewContent: EditorInitial["previewContent"];
  contactEmail: string;
  socialLinks: {
    facebookUrl: string;
    instagramUrl: string;
    linkedinUrl: string;
  };
}) {
  const labels = {
    team: locale === "nl" ? "Team" : "Team",
    events: locale === "nl" ? "Evenementen" : "Events",
    partners: locale === "nl" ? "Partners" : "Partners",
  };
  const sectionStyle = {
    backgroundColor: colors.backgroundColor,
    color: colors.textColor,
  };
  const headingStyle = {
    fontSize: `${1.45 * typography.headingFontScale}rem`,
  };
  const bodyStyle = {
    color: colors.mutedColor,
    fontSize: `${0.72 * typography.bodyFontScale}rem`,
  };

  if (section === "about") {
    return (
      <section className="border-t border-black/5 p-5" style={sectionStyle}>
        <div
          className={`grid items-start gap-4 ${
            aboutImageUrl && device === "desktop" ? "" : "grid-cols-1"
          }`}
          style={
            aboutImageUrl && device === "desktop"
              ? {
                  gridTemplateColumns: `${100 - aboutCoverColumnWidth}fr ${aboutCoverColumnWidth}fr`,
                }
              : undefined
          }
        >
          <div>
            <PreviewEyebrow color={colors.primaryColor}>
              {locale === "nl" ? "Over" : "About"}
            </PreviewEyebrow>
            <h3 className="mt-1 font-semibold" style={headingStyle}>
              {copy.aboutTitle[locale]}
            </h3>
            <div className="mt-3" style={bodyStyle}>
              <MarkdownContent
                headingOffset={3}
                className="markdown-preview-compact leading-relaxed"
              >
                {copy.aboutText[locale]}
              </MarkdownContent>
            </div>
          </div>
          {aboutImageUrl ? (
            <CustomPageCover
              src={aboutImageUrl}
              alt=""
              mode={aboutCover.mode}
              width={aboutCover.width}
              positionX={aboutCover.positionX}
              positionY={aboutCover.positionY}
              zoom={aboutCover.zoom}
              borderWidth={aboutCover.borderWidth}
              borderStyle={aboutCover.borderStyle}
              borderColor={aboutCover.borderColor}
              borderRadius={aboutCover.borderRadius}
              shadow={aboutCover.shadow}
              frameShape="side"
            />
          ) : null}
        </div>
      </section>
    );
  }

  if (section === "team") {
    return (
      <PreviewSectionShell
        eyebrow={locale === "nl" ? "Mensen" : "People"}
        title={labels.team}
        colors={colors}
        headingStyle={headingStyle}
      >
        <div className="grid grid-cols-3 gap-2">
          {previewContent.team.length ? (
            previewContent.team.map((member, index) => (
              <div
                key={`${member.name}-${index}`}
                className="min-w-0 rounded-xl p-2"
                style={{ backgroundColor: colors.surfaceColor }}
              >
                <PreviewImage src={member.imageUrl} fallback={member.name} square />
                <p className="mt-2 truncate text-[10px] font-semibold">
                  {member.name}
                </p>
                <p className="truncate text-[9px]" style={{ color: colors.mutedColor }}>
                  {member.role}
                </p>
              </div>
            ))
          ) : (
            <PreviewEmpty text="No visible team members yet." colors={colors} />
          )}
        </div>
      </PreviewSectionShell>
    );
  }

  if (section === "events") {
    return (
      <PreviewSectionShell
        eyebrow={locale === "nl" ? "Agenda" : "Agenda"}
        title={labels.events}
        colors={colors}
        headingStyle={headingStyle}
      >
        <div className="grid grid-cols-2 gap-2">
          {previewContent.events.length ? (
            previewContent.events.map((event, index) => (
              <div
                key={`${event.title}-${index}`}
                className="overflow-hidden rounded-xl"
                style={{ backgroundColor: colors.surfaceColor }}
              >
                <PreviewImage src={event.imageUrl} fallback={event.title} />
                <p className="truncate p-2 text-[10px] font-semibold">
                  {event.title}
                </p>
              </div>
            ))
          ) : (
            <PreviewEmpty text="No published events yet." colors={colors} />
          )}
        </div>
      </PreviewSectionShell>
    );
  }

  if (section === "partners") {
    return (
      <PreviewSectionShell
        eyebrow={labels.partners}
        title={labels.partners}
        colors={colors}
        headingStyle={headingStyle}
      >
        <div className="grid grid-cols-3 gap-2">
          {previewContent.partners.length ? (
            previewContent.partners.map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                className="grid min-h-16 place-items-center rounded-xl p-2 text-center text-[9px] font-semibold"
                style={{ backgroundColor: colors.surfaceColor }}
              >
                {partner.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.imageUrl}
                    alt={partner.name}
                    className="max-h-10 max-w-full object-contain"
                  />
                ) : (
                  partner.name
                )}
              </div>
            ))
          ) : (
            <PreviewEmpty text="No visible partners yet." colors={colors} />
          )}
        </div>
      </PreviewSectionShell>
    );
  }

  const enabledSocials = Object.entries(socialLinks).filter(([, href]) => href);
  return (
    <PreviewSectionShell
      eyebrow={locale === "nl" ? "Contact" : "Contact"}
      title={copy.contactTitle[locale]}
      colors={colors}
      headingStyle={headingStyle}
    >
      <div className="grid gap-3">
        <div style={bodyStyle}>
          <MarkdownContent
            headingOffset={3}
            className="markdown-preview-compact leading-relaxed"
          >
            {copy.contactText[locale]}
          </MarkdownContent>
        </div>
        <p className="break-all text-xs font-semibold" style={{ color: colors.primaryColor }}>
          {contactEmail}
        </p>
        {enabledSocials.length ? (
          <div className="flex flex-wrap gap-1.5">
            {enabledSocials.map(([key]) => (
              <span
                key={key}
                className="rounded-full px-2 py-1 text-[9px] font-semibold"
                style={{ backgroundColor: colors.surfaceColor }}
              >
                {key.replace("Url", "")}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </PreviewSectionShell>
  );
}

function PreviewSectionShell({
  eyebrow,
  title,
  colors,
  headingStyle,
  children,
}: {
  eyebrow: string;
  title: string;
  colors: EditorInitial["colors"];
  headingStyle: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border-t border-black/5 p-5"
      style={{ backgroundColor: colors.backgroundColor, color: colors.textColor }}
    >
      <PreviewEyebrow color={colors.primaryColor}>{eyebrow}</PreviewEyebrow>
      <h3 className="mb-3 mt-1 font-semibold" style={headingStyle}>
        {title}
      </h3>
      {children}
    </section>
  );
}

function PreviewEyebrow({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className="text-[9px] font-semibold uppercase tracking-[0.16em]"
      style={{ color }}
    >
      {children}
    </p>
  );
}

function PreviewImage({
  src,
  fallback,
  square = false,
}: {
  src: string | null;
  fallback: string;
  square?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center overflow-hidden bg-black/5 text-xs font-semibold ${
        square ? "aspect-square rounded-lg" : "aspect-[16/9]"
      }`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        fallback.slice(0, 1)
      )}
    </div>
  );
}

function PreviewEmpty({
  text,
  colors,
}: {
  text: string;
  colors: EditorInitial["colors"];
}) {
  return (
    <p
      className="col-span-full rounded-xl p-3 text-[10px]"
      style={{ backgroundColor: colors.surfaceColor, color: colors.mutedColor }}
    >
      {text}
    </p>
  );
}

function useObjectUrlCleanup(url: string | null) {
  useEffect(
    () => () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    },
    [url],
  );
}

function ChoiceCard({
  checked,
  name,
  value,
  title,
  description,
  onChange,
}: {
  checked: boolean;
  name: string;
  value: string;
  title: string;
  description: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-2xl border p-4 transition ${
        checked
          ? "border-[#006d77] bg-[#006d77]/5 ring-2 ring-[#006d77]/10"
          : "border-black/10 hover:border-black/20"
      }`}
    >
      <span className="flex items-start gap-3">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="mt-1 h-4 w-4 accent-[#006d77]"
        />
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-[#6f6860]">
            {description}
          </span>
        </span>
      </span>
    </label>
  );
}

function LocalizedControl({
  label,
  hint,
  field,
  values,
  languageChoice,
  activeLocale,
  onChange,
  multiline = false,
  markdown = false,
  required = false,
}: {
  label: string;
  hint?: string;
  field: CopyKey;
  values: Record<Locale, string>;
  languageChoice: "single" | "bilingual";
  activeLocale: Locale;
  onChange: (locale: Locale, value: string) => void;
  multiline?: boolean;
  markdown?: boolean;
  required?: boolean;
}) {
  const visibleLocales: Locale[] =
    languageChoice === "bilingual" ? ["en", "nl"] : [activeLocale];
  const hiddenLocales = (["en", "nl"] as const).filter(
    (locale) => !visibleLocales.includes(locale),
  );

  return (
    <div>
      {hint ? <p className="mb-2 text-xs leading-5 text-[#6f6860]">{hint}</p> : null}
      <div
        className={
          languageChoice === "bilingual" ? "grid gap-4 lg:grid-cols-2" : "grid"
        }
      >
        {visibleLocales.map((locale) => (
          <Field
            key={locale}
            composite={markdown}
            label={
              languageChoice === "bilingual"
                ? `${label} · ${locale === "en" ? "English" : "Dutch"}`
                : label
            }
          >
            {markdown ? (
              <MarkdownEditor
                ariaLabel={
                  languageChoice === "bilingual"
                    ? `${label} · ${locale === "en" ? "English" : "Dutch"}`
                    : label
                }
                name={`${field}${locale === "en" ? "En" : "Nl"}`}
                value={values[locale]}
                onChange={(value) => onChange(locale, value)}
                required={required}
                headingOffset={2}
              />
            ) : multiline ? (
              <textarea
                name={`${field}${locale === "en" ? "En" : "Nl"}`}
                required={required}
                value={values[locale]}
                onChange={(event) => onChange(locale, event.target.value)}
                className={textareaClass}
              />
            ) : (
              <input
                name={`${field}${locale === "en" ? "En" : "Nl"}`}
                required={required}
                value={values[locale]}
                onChange={(event) => onChange(locale, event.target.value)}
                className={inputClass}
              />
            )}
          </Field>
        ))}
      </div>
      {hiddenLocales.map((locale) => (
        <input
          key={locale}
          type="hidden"
          name={`${field}${locale === "en" ? "En" : "Nl"}`}
          value={values[locale]}
        />
      ))}
    </div>
  );
}

function MediaField({
  label,
  name,
  currentName,
  previewUrl,
  removeName,
  remove,
  onRemove,
  onFile,
  help,
  accept = "image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon,.ico",
  wide = false,
  previewContain = false,
}: {
  label: string;
  name: string;
  currentName: string | null;
  previewUrl: string | null;
  removeName: string;
  remove: boolean;
  onRemove: (checked: boolean) => void;
  onFile: (file: File | undefined) => void;
  help?: string;
  accept?: string;
  wide?: boolean;
  previewContain?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <Field label={label}>
        <div className="rounded-2xl border border-black/10 p-3">
          <div className="flex items-center gap-3">
            <div
              className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f5f1e8] text-[#9b948a] ${
                wide ? "h-20 w-32" : "h-16 w-16"
              }`}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt=""
                  className={`h-full w-full ${previewContain ? "object-contain p-2" : "object-cover"}`}
                />
              ) : (
                <ImageIcon size={22} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#6f6860]">
                {remove
                  ? "Will be removed when saved"
                  : currentName || (previewUrl ? "New image selected" : "No image yet")}
              </p>
              <input
                name={name}
                type="file"
                accept={accept}
                className="mt-2 block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-[#211f1c] file:px-3 file:py-1.5 file:font-semibold file:text-white"
                onChange={(event) => onFile(event.target.files?.[0])}
              />
            </div>
          </div>
          {help ? <p className="mt-2 text-xs text-[#6f6860]">{help}</p> : null}
          {currentName || previewUrl ? (
            <label className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3 text-xs font-medium text-[#6f6860]">
              <input
                name={removeName}
                type="checkbox"
                checked={remove}
                onChange={(event) => onRemove(event.target.checked)}
                className="h-4 w-4 accent-red-600"
              />
              Remove this image
            </label>
          ) : null}
        </div>
      </Field>
    </div>
  );
}

function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-[#3a352f]">
      <span>{label}</span>
      <span className="flex min-w-0 items-center gap-2 overflow-hidden rounded-2xl border border-black/10 bg-white p-2">
        <input
          type="color"
          value={value}
          aria-label={`${label} color picker`}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent"
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          name={name}
          value={value}
          pattern="#[0-9a-fA-F]{6}"
          aria-label={`${label} hex value`}
          className="min-w-0 flex-1 bg-transparent px-1 font-mono text-xs font-medium uppercase outline-none"
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  );
}

function ScaleField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-2xl border border-black/10 p-4">
      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-[#3a352f]">
        <span className="flex items-center gap-2">
          <Type size={16} className="text-[#006d77]" />
          {label}
        </span>
        <output>{Math.round(value * 100)}%</output>
      </span>
      <input
        name={name}
        type="range"
        min="0.8"
        max="1.5"
        step="0.05"
        value={value}
        className="mt-4 w-full accent-[#006d77]"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="mt-1 flex justify-between text-[10px] font-medium text-[#9b948a]">
        <span>Smaller</span>
        <span>Default</span>
        <span>Larger</span>
      </span>
    </label>
  );
}

function PreviewBrand({
  logoMode,
  logoUrl,
  name,
  primaryColor,
}: {
  logoMode: LogoMode;
  logoUrl: string | null;
  name: string;
  primaryColor: string;
}) {
  if (logoMode === "wordmark" && logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className="h-8 w-auto max-w-[65%] object-contain" />
    );
  }

  if (logoMode === "wordmark") {
    return <span className="truncate text-xs font-semibold">{name}</span>;
  }

  return (
    <span className="flex min-w-0 items-center gap-2 text-xs font-semibold">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/10"
        style={{ color: primaryColor }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          name.slice(0, 1)
        )}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}

function PreviewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-full transition ${
        active ? "bg-white text-[#211f1c]" : "text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SaveButton({ compact = false }: { compact?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
        compact
          ? "bg-white px-4 py-2 text-xs text-[#211f1c]"
          : "bg-[#006d77] px-5 py-2.5 text-sm text-white hover:-translate-y-0.5 hover:shadow-lg"
      }`}
    >
      <Save size={compact ? 14 : 16} />
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}
