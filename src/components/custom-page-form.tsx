"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ChevronDown,
  FilePlus2,
  ImageIcon,
  Monitor,
  Smartphone,
} from "lucide-react";
import {
  Field,
  buttonClass,
  inputClass,
  textareaClass,
} from "@/components/admin-shell";
import {
  CustomPageCover,
  type CustomPageCoverBorderStyle,
  type CustomPageCoverMode,
  type CustomPageCoverShadow,
} from "@/components/custom-page-cover";
import {
  CoverSettingsEditor,
  type CoverSettings,
} from "@/components/cover-settings-editor";
import { MarkdownContent } from "@/components/markdown-content";
import { MarkdownEditor } from "@/components/markdown-editor";
import type { AdminLanguageConfig } from "@/components/admin-localized-field";
import { saveCustomPage } from "@/lib/admin-actions";

type Locale = "en" | "nl";
type PageCopyKey = "title" | "eyebrow" | "supportingText" | "content";
type PageCopy = Record<PageCopyKey, Record<Locale, string>>;

export type CustomPageEditorPage = {
  id: string;
  slug: string;
  titleEn: string;
  titleNl: string;
  eyebrowEn: string | null;
  eyebrowNl: string | null;
  supportingTextEn: string | null;
  supportingTextNl: string | null;
  contentEn: string;
  contentNl: string;
  coverMediaId: string | null;
  coverName: string | null;
  coverUrl: string | null;
  coverDisplayMode: CustomPageCoverMode;
  coverWidth: number;
  coverPositionX: number;
  coverPositionY: number;
  coverZoom: number;
  coverBorderWidth: number;
  coverBorderStyle: CustomPageCoverBorderStyle;
  coverBorderColor: string;
  coverBorderRadius: number;
  coverFrameShadow: CustomPageCoverShadow;
  coverPlacement: "above" | "left" | "right";
  coverSideWidth: number;
  isPublished: boolean;
  showInNavigation: boolean;
};

export type CustomPagePreviewConfig = {
  headerName: Record<Locale, string>;
  logoMode: "iconWithText" | "wordmark";
  logoUrl: string | null;
  colors: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    primary: string;
    accent: string;
    header: string;
  };
  typography: {
    body: number;
    heading: number;
  };
};

export function CustomPageForm({
  page,
  languageConfig,
  previewConfig,
}: {
  page?: CustomPageEditorPage;
  languageConfig: AdminLanguageConfig;
  previewConfig: CustomPagePreviewConfig;
}) {
  const primaryLocale: Locale =
    languageConfig.languageMode === "dutchOnly"
      ? "nl"
      : languageConfig.languageMode === "englishOnly"
        ? "en"
        : languageConfig.defaultLocale;
  const [previewLocale, setPreviewLocale] = useState(primaryLocale);
  const [copy, setCopy] = useState<PageCopy>({
    title: { en: page?.titleEn ?? "", nl: page?.titleNl ?? "" },
    eyebrow: { en: page?.eyebrowEn ?? "", nl: page?.eyebrowNl ?? "" },
    supportingText: {
      en: page?.supportingTextEn ?? "",
      nl: page?.supportingTextNl ?? "",
    },
    content: { en: page?.contentEn ?? "", nl: page?.contentNl ?? "" },
  });
  const [coverUrl, setCoverUrl] = useState(page?.coverUrl ?? null);
  const [removeCover, setRemoveCover] = useState(false);
  const [coverSettings, setCoverSettings] = useState<CoverSettings>({
    mode: page?.coverDisplayMode ?? "full",
    width: page?.coverWidth ?? 75,
    positionX: page?.coverPositionX ?? 50,
    positionY: page?.coverPositionY ?? 50,
    zoom: page?.coverZoom ?? 1,
    borderWidth: page?.coverBorderWidth ?? 0,
    borderStyle: page?.coverBorderStyle ?? "solid",
    borderColor: page?.coverBorderColor ?? "#231f20",
    borderRadius: page?.coverBorderRadius ?? 32,
    shadow: page?.coverFrameShadow ?? "strong",
  });
  const [coverPlacement, setCoverPlacement] = useState<"above" | "left" | "right">(
    page?.coverPlacement ?? "above",
  );
  const [coverSideWidth, setCoverSideWidth] = useState(
    page?.coverSideWidth ?? 42,
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (coverUrl?.startsWith("blob:")) URL.revokeObjectURL(coverUrl);
    },
    [coverUrl],
  );

  function updateCopy(key: PageCopyKey, locale: Locale, nextValue: string) {
    setCopy((current) => ({
      ...current,
      [key]: { ...current[key], [locale]: nextValue },
    }));
  }

  function selectCover(file: File | undefined) {
    if (!file) return;
    setRemoveCover(false);
    setCoverUrl(URL.createObjectURL(file));
  }

  const visibleCoverUrl = removeCover ? null : coverUrl;
  const previewTitle = copy.title[previewLocale] || "Your page title";
  const {
    mode: coverMode,
    width: coverWidth,
    positionX,
    positionY,
    zoom,
    borderWidth,
    borderStyle,
    borderColor,
    borderRadius,
    shadow: frameShadow,
  } = coverSettings;

  return (
    <form
      action={saveCustomPage}
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"
    >
      {page ? <input type="hidden" name="id" value={page.id} /> : null}

      <div className="grid min-w-0 gap-5">
        <LocalizedPageField
          label="Title"
          name="title"
          values={copy.title}
          languageConfig={languageConfig}
          onChange={(locale, nextValue) => updateCopy("title", locale, nextValue)}
          required
        />
        <LocalizedPageField
          label="Eyebrow (optional)"
          name="eyebrow"
          values={copy.eyebrow}
          languageConfig={languageConfig}
          onChange={(locale, nextValue) =>
            updateCopy("eyebrow", locale, nextValue)
          }
          placeholder="Small label above the title"
        />
        <LocalizedPageField
          label="Supporting text (optional)"
          name="supportingText"
          values={copy.supportingText}
          languageConfig={languageConfig}
          onChange={(locale, nextValue) =>
            updateCopy("supportingText", locale, nextValue)
          }
          placeholder="A short introduction below the title"
          multiline
        />

        <details className="group overflow-hidden rounded-2xl border border-black/10 bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#006d77]/8 text-[#006d77]">
              <ImageIcon size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Cover photo</span>
              <span className="mt-0.5 block truncate text-xs text-[#6f6860]">
                {page?.coverName
                  ? `Current: ${page.coverName}`
                  : "Optional image, placement, crop, and border settings"}
              </span>
            </span>
            <ChevronDown
              size={17}
              className="shrink-0 text-[#8b847b] transition group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-black/5 p-4 sm:p-5">
          <input
            ref={coverInputRef}
            name="cover"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className={inputClass}
            onChange={(event) => selectCover(event.target.files?.[0])}
          />
          {page?.coverMediaId ? (
            <label className="mt-3 flex items-center gap-2 text-xs font-medium text-[#6f6860]">
              <input
                name="removeCover"
                type="checkbox"
                checked={removeCover}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setRemoveCover(checked);
                  if (checked && coverInputRef.current) {
                    coverInputRef.current.value = "";
                    setCoverUrl(page?.coverUrl ?? null);
                  }
                }}
                className="h-4 w-4 accent-red-600"
              />
              Remove the current cover photo
            </label>
          ) : null}

          <fieldset className="mt-5 border-b border-black/10 pb-5">
            <legend className="text-sm font-semibold">Page placement</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["above", "Above content"],
                  ["left", "Left of content"],
                  ["right", "Right of content"],
                ] as const
              ).map(([placement, label]) => (
                <label
                  key={placement}
                  className={`cursor-pointer rounded-2xl border p-3 text-xs font-semibold transition ${
                    coverPlacement === placement
                      ? "border-[#006d77] bg-[#006d77]/5 ring-2 ring-[#006d77]/10"
                      : "border-black/10 hover:border-black/20"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      name="coverPlacement"
                      type="radio"
                      value={placement}
                      checked={coverPlacement === placement}
                      onChange={() => setCoverPlacement(placement)}
                      className="h-4 w-4 accent-[#006d77]"
                    />
                    {label}
                  </span>
                </label>
              ))}
            </div>
            {coverPlacement !== "above" ? (
              <label className="mt-4 block text-xs font-semibold text-[#3a352f]">
                <span className="flex items-center justify-between gap-2">
                  Image column width
                  <output>{Math.round(coverSideWidth)}%</output>
                </span>
                <input
                  name="coverSideWidth"
                  type="range"
                  min="30"
                  max="60"
                  step="1"
                  value={coverSideWidth}
                  onChange={(event) =>
                    setCoverSideWidth(Number(event.target.value))
                  }
                  className="mt-2 block w-full accent-[#006d77]"
                />
              </label>
            ) : (
              <input
                type="hidden"
                name="coverSideWidth"
                value={coverSideWidth}
              />
            )}
          </fieldset>

          <div className="mt-5">
            <CoverSettingsEditor
              namePrefix="cover"
              value={coverSettings}
              onChange={setCoverSettings}
              previewUrl={visibleCoverUrl}
              frameShape={coverPlacement === "above" ? "wide" : "side"}
            />
          </div>
          </div>
        </details>

        <details className="rounded-2xl border border-black/10 p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Advanced URL setting
          </summary>
          <div className="mt-4">
            <Field label="Page address">
              <input
                name="slug"
                defaultValue={page?.slug ?? ""}
                className={inputClass}
                placeholder="Generated from the title when empty"
              />
            </Field>
            <p className="mt-2 text-xs leading-5 text-[#6f6860]">
              The public URL will start with /pages/. Duplicate addresses get a
              number automatically.
            </p>
          </div>
        </details>

        <LocalizedPageField
          label="Content"
          name="content"
          values={copy.content}
          languageConfig={languageConfig}
          onChange={(locale, nextValue) =>
            updateCopy("content", locale, nextValue)
          }
          markdown
        />

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              name="isPublished"
              type="checkbox"
              defaultChecked={page?.isPublished ?? false}
              className="h-5 w-5 accent-[#006d77]"
            />
            Published
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              name="showInNavigation"
              type="checkbox"
              defaultChecked={page?.showInNavigation ?? false}
              className="h-5 w-5 accent-[#006d77]"
            />
            Show in website header
          </label>
        </div>
        <SavePageButton isExisting={Boolean(page)} />
      </div>

      <aside className="min-w-0 xl:sticky xl:top-6">
        <div className="flex max-h-[calc(100vh-3rem)] flex-col rounded-[1.75rem] bg-[#211f1c] p-3 shadow-lg shadow-black/10">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3 px-2 pt-1 text-white">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                Live page preview
              </p>
              <p className="text-xs font-semibold">Header, cover and content</p>
            </div>
            <div className="flex gap-1 rounded-full bg-white/10 p-1">
              <PreviewButton
                label="Desktop preview"
                active={device === "desktop"}
                onClick={() => setDevice("desktop")}
              >
                <Monitor size={14} />
              </PreviewButton>
              <PreviewButton
                label="Mobile preview"
                active={device === "mobile"}
                onClick={() => setDevice("mobile")}
              >
                <Smartphone size={14} />
              </PreviewButton>
            </div>
          </div>

          <div
            className={`mx-auto min-h-0 w-full flex-1 overflow-y-auto overscroll-contain rounded-[1.2rem] bg-white transition-all ${
              device === "mobile" ? "max-w-[290px]" : "max-w-full"
            }`}
            style={
              {
                "--background": previewConfig.colors.background,
                "--surface": previewConfig.colors.surface,
                "--text": previewConfig.colors.text,
                "--muted": previewConfig.colors.muted,
                "--primary": previewConfig.colors.primary,
                "--accent": previewConfig.colors.accent,
              } as React.CSSProperties
            }
          >
            <div
              className="flex h-14 items-center justify-between gap-2 border-b border-black/10 px-3"
              style={{
                backgroundColor: previewConfig.colors.header,
                color: previewConfig.colors.text,
              }}
            >
              <PreviewBrand
                name={previewConfig.headerName[previewLocale]}
                logoMode={previewConfig.logoMode}
                logoUrl={previewConfig.logoUrl}
                primaryColor={previewConfig.colors.primary}
              />
              {languageConfig.languageMode === "bilingual" ? (
                <div className="flex shrink-0 rounded-full bg-black/5 p-0.5 text-[9px] font-bold">
                  {(["en", "nl"] as const).map((locale) => (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => setPreviewLocale(locale)}
                      className={`rounded-full px-2 py-1 uppercase ${
                        previewLocale === locale ? "text-white" : "opacity-55"
                      }`}
                      style={
                        previewLocale === locale
                          ? { backgroundColor: previewConfig.colors.primary }
                          : undefined
                      }
                    >
                      {locale}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <article
              className="min-h-[32rem] px-5 py-8"
              style={{
                backgroundColor: previewConfig.colors.background,
                color: previewConfig.colors.text,
                fontSize: `${0.76 * previewConfig.typography.body}rem`,
              }}
            >
              {copy.eyebrow[previewLocale] ? (
                <p
                  className="font-semibold uppercase tracking-[0.16em]"
                  style={{ color: previewConfig.colors.primary, fontSize: ".58rem" }}
                >
                  {copy.eyebrow[previewLocale]}
                </p>
              ) : null}
              <h3
                className="mt-2 font-semibold leading-[1.04]"
                style={{ fontSize: `${1.8 * previewConfig.typography.heading}rem` }}
              >
                {previewTitle}
              </h3>
              {copy.supportingText[previewLocale] ? (
                <p
                  className="mt-4 whitespace-pre-line leading-relaxed"
                  style={{ color: previewConfig.colors.muted }}
                >
                  {copy.supportingText[previewLocale]}
                </p>
              ) : null}
              {visibleCoverUrl && coverPlacement !== "above" ? (
                <div
                  className={`mt-6 grid gap-5 ${
                    device === "desktop" ? "items-start" : ""
                  }`}
                  style={
                    device === "desktop"
                      ? {
                          gridTemplateColumns:
                            coverPlacement === "right"
                              ? `${100 - coverSideWidth}fr ${coverSideWidth}fr`
                              : `${coverSideWidth}fr ${100 - coverSideWidth}fr`,
                        }
                      : undefined
                  }
                >
                  <div
                    className={
                      coverPlacement === "right" && device === "desktop"
                        ? "order-2"
                        : undefined
                    }
                  >
                    <CustomPageCover
                      src={visibleCoverUrl}
                      alt={previewTitle}
                      mode={coverMode}
                      width={coverWidth}
                      positionX={positionX}
                      positionY={positionY}
                      zoom={zoom}
                      borderWidth={borderWidth}
                      borderStyle={borderStyle}
                      borderColor={borderColor}
                      borderRadius={borderRadius}
                      shadow={frameShadow}
                      frameShape="side"
                    />
                  </div>
                  <PreviewPageContent
                    content={copy.content[previewLocale]}
                    mutedColor={previewConfig.colors.muted}
                  />
                </div>
              ) : (
                <>
                  {visibleCoverUrl ? (
                    <CustomPageCover
                      src={visibleCoverUrl}
                      alt={previewTitle}
                      mode={coverMode}
                      width={coverWidth}
                      positionX={positionX}
                      positionY={positionY}
                      zoom={zoom}
                      borderWidth={borderWidth}
                      borderStyle={borderStyle}
                      borderColor={borderColor}
                      borderRadius={borderRadius}
                      shadow={frameShadow}
                      className="mt-6"
                    />
                  ) : null}
                  <div className="mt-7">
                    <PreviewPageContent
                      content={copy.content[previewLocale]}
                      mutedColor={previewConfig.colors.muted}
                    />
                  </div>
                </>
              )}
            </article>
          </div>
          <p className="shrink-0 px-2 pb-1 pt-3 text-[11px] text-white/55">
            This preview scrolls and updates before you save.
          </p>
        </div>
      </aside>
    </form>
  );
}

function LocalizedPageField({
  label,
  name,
  values,
  languageConfig,
  onChange,
  required = false,
  multiline = false,
  markdown = false,
  placeholder,
}: {
  label: string;
  name: string;
  values: Record<Locale, string>;
  languageConfig: AdminLanguageConfig;
  onChange: (locale: Locale, value: string) => void;
  required?: boolean;
  multiline?: boolean;
  markdown?: boolean;
  placeholder?: string;
}) {
  const primaryLocale: Locale =
    languageConfig.languageMode === "dutchOnly"
      ? "nl"
      : languageConfig.languageMode === "englishOnly"
        ? "en"
        : languageConfig.defaultLocale;
  const visibleLocales: Locale[] =
    languageConfig.languageMode === "bilingual" ? ["en", "nl"] : [primaryLocale];
  const hiddenLocales = (["en", "nl"] as const).filter(
    (locale) => !visibleLocales.includes(locale),
  );

  return (
    <div>
      <div
        className={
          languageConfig.languageMode === "bilingual"
            ? "grid gap-4 2xl:grid-cols-2"
            : "grid"
        }
      >
        {visibleLocales.map((locale) => {
          const localizedLabel =
            languageConfig.languageMode === "bilingual"
              ? `${label} — ${locale === "en" ? "English" : "Nederlands"}`
              : label;
          const fieldName = `${name}${locale === "en" ? "En" : "Nl"}`;

          return (
            <Field key={locale} label={localizedLabel} composite={markdown}>
              {markdown ? (
                <MarkdownEditor
                  ariaLabel={localizedLabel}
                  name={fieldName}
                  value={values[locale]}
                  onChange={(nextValue) => onChange(locale, nextValue)}
                  required={required}
                  placeholder={placeholder}
                  minHeight="12rem"
                />
              ) : multiline ? (
                <textarea
                  name={fieldName}
                  value={values[locale]}
                  onChange={(event) => onChange(locale, event.target.value)}
                  required={required}
                  placeholder={placeholder}
                  className={textareaClass}
                />
              ) : (
                <input
                  name={fieldName}
                  value={values[locale]}
                  onChange={(event) => onChange(locale, event.target.value)}
                  required={required}
                  placeholder={placeholder}
                  className={inputClass}
                />
              )}
            </Field>
          );
        })}
      </div>
      {hiddenLocales.map((locale) => (
        <input
          key={locale}
          type="hidden"
          name={`${name}${locale === "en" ? "En" : "Nl"}`}
          value={values[locale]}
        />
      ))}
    </div>
  );
}

function PreviewBrand({
  name,
  logoMode,
  logoUrl,
  primaryColor,
}: {
  name: string;
  logoMode: "iconWithText" | "wordmark";
  logoUrl: string | null;
  primaryColor: string;
}) {
  if (logoMode === "wordmark" && logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className="h-8 w-auto max-w-[62%] object-contain" />
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
          <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          name.slice(0, 1)
        )}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}

function PreviewButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
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

function PreviewPageContent({
  content,
  mutedColor,
}: {
  content: string;
  mutedColor: string;
}) {
  return content ? (
    <MarkdownContent headingOffset={1} className="markdown-preview-page">
      {content}
    </MarkdownContent>
  ) : (
    <p className="italic" style={{ color: mutedColor }}>
      Page content will appear here.
    </p>
  );
}

function SavePageButton({ isExisting }: { isExisting: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonClass} w-fit gap-2 disabled:cursor-wait disabled:opacity-65`}
    >
      <FilePlus2 size={16} />
      {pending ? "Saving…" : isExisting ? "Save page" : "Add page"}
    </button>
  );
}
