"use client";

import { useEffect, useRef, useState } from "react";
import { FilePlus2, ImageIcon, Monitor, Smartphone } from "lucide-react";
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

const coverModes: {
  value: CustomPageCoverMode;
  title: string;
  description: string;
}[] = [
  {
    value: "full",
    title: "Full image",
    description: "Show the complete image at full content width.",
  },
  {
    value: "flexible",
    title: "Flexible size",
    description: "Show the complete image at an adjustable width.",
  },
  {
    value: "fit",
    title: "Fit",
    description: "Keep the whole image visible inside a wide frame.",
  },
  {
    value: "fill",
    title: "Fill",
    description: "Fill the wide frame with an automatic centered crop.",
  },
  {
    value: "crop",
    title: "Crop & position",
    description: "Zoom and drag the image to choose the visible portion.",
  },
];

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
  const [coverMode, setCoverMode] = useState<CustomPageCoverMode>(
    page?.coverDisplayMode ?? "full",
  );
  const [coverWidth, setCoverWidth] = useState(page?.coverWidth ?? 75);
  const [positionX, setPositionX] = useState(page?.coverPositionX ?? 50);
  const [positionY, setPositionY] = useState(page?.coverPositionY ?? 50);
  const [zoom, setZoom] = useState(page?.coverZoom ?? 1);
  const [borderWidth, setBorderWidth] = useState(page?.coverBorderWidth ?? 0);
  const [borderStyle, setBorderStyle] = useState<CustomPageCoverBorderStyle>(
    page?.coverBorderStyle ?? "solid",
  );
  const [borderColor, setBorderColor] = useState(
    page?.coverBorderColor ?? "#231f20",
  );
  const [borderRadius, setBorderRadius] = useState(
    page?.coverBorderRadius ?? 32,
  );
  const [frameShadow, setFrameShadow] = useState<CustomPageCoverShadow>(
    page?.coverFrameShadow ?? "strong",
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const dragStart = useRef<{
    clientX: number;
    clientY: number;
    positionX: number;
    positionY: number;
  } | null>(null);
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

  function moveCrop(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current || coverMode !== "crop") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX = ((event.clientX - dragStart.current.clientX) / bounds.width) * 100;
    const deltaY = ((event.clientY - dragStart.current.clientY) / bounds.height) * 100;
    setPositionX(clamp(dragStart.current.positionX - deltaX / zoom, 0, 100));
    setPositionY(clamp(dragStart.current.positionY - deltaY / zoom, 0, 100));
  }

  const visibleCoverUrl = removeCover ? null : coverUrl;
  const previewTitle = copy.title[previewLocale] || "Your page title";

  return (
    <form
      action={saveCustomPage}
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"
    >
      {page ? <input type="hidden" name="id" value={page.id} /> : null}
      <input type="hidden" name="coverPositionX" value={positionX} />
      <input type="hidden" name="coverPositionY" value={positionY} />

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

        <div className="rounded-3xl border border-black/10 p-4 sm:p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold">Cover photo</h4>
            <p className="mt-1 text-xs leading-5 text-[#6f6860]">
              Choose how the image should behave on the public page.
            </p>
          </div>
          <input
            ref={coverInputRef}
            name="cover"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className={inputClass}
            onChange={(event) => selectCover(event.target.files?.[0])}
          />
          {page?.coverName ? (
            <p className="mt-2 truncate text-xs text-[#6f6860]">
              Current: {page.coverName}
            </p>
          ) : null}
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

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Image layout</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {coverModes.map((mode) => (
                <label
                  key={mode.value}
                  className={`cursor-pointer rounded-2xl border p-3 transition ${
                    coverMode === mode.value
                      ? "border-[#006d77] bg-[#006d77]/5 ring-2 ring-[#006d77]/10"
                      : "border-black/10 hover:border-black/20"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    <input
                      name="coverDisplayMode"
                      type="radio"
                      value={mode.value}
                      checked={coverMode === mode.value}
                      onChange={() => setCoverMode(mode.value)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#006d77]"
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">
                        {mode.title}
                      </span>
                      <span className="mt-1 block text-[11px] leading-4 text-[#6f6860]">
                        {mode.description}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {coverMode === "flexible" ? (
            <label className="mt-5 block text-sm font-semibold">
              <span className="flex items-center justify-between gap-3">
                Image size
                <output>{Math.round(coverWidth)}%</output>
              </span>
              <input
                name="coverWidth"
                type="range"
                min="25"
                max="100"
                step="1"
                value={coverWidth}
                onChange={(event) => setCoverWidth(Number(event.target.value))}
                className="mt-2 w-full accent-[#006d77]"
              />
              <span className="mt-1 block text-xs font-normal leading-5 text-[#6f6860]">
                The complete image and its frame keep their natural aspect ratio.
              </span>
            </label>
          ) : (
            <input type="hidden" name="coverWidth" value={coverWidth} />
          )}

          {coverMode === "crop" ? (
            <div className="mt-5">
              <label className="block text-sm font-semibold">
                <span className="flex items-center justify-between gap-3">
                  Zoom
                  <output>{Math.round(zoom * 100)}%</output>
                </span>
                <input
                  name="coverZoom"
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="mt-2 w-full accent-[#006d77]"
                />
              </label>
              <p className="mt-1 text-xs text-[#6f6860]">
                Drag the image below to position the crop.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#3a352f]">
                  Horizontal position
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={positionX}
                    onChange={(event) => setPositionX(Number(event.target.value))}
                    className="mt-1 block w-full accent-[#006d77]"
                  />
                </label>
                <label className="text-xs font-semibold text-[#3a352f]">
                  Vertical position
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={positionY}
                    onChange={(event) => setPositionY(Number(event.target.value))}
                    className="mt-1 block w-full accent-[#006d77]"
                  />
                </label>
              </div>
            </div>
          ) : (
            <input type="hidden" name="coverZoom" value={zoom} />
          )}

          <fieldset className="mt-6 border-t border-black/10 pt-5">
            <legend className="px-1 text-sm font-semibold">Frame style</legend>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#3a352f]">
                <span className="flex items-center justify-between gap-2">
                  Border thickness
                  <output>{Math.round(borderWidth)}px</output>
                </span>
                <input
                  name="coverBorderWidth"
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={borderWidth}
                  onChange={(event) =>
                    setBorderWidth(Number(event.target.value))
                  }
                  className="mt-2 block w-full accent-[#006d77]"
                />
              </label>
              <label className="text-xs font-semibold text-[#3a352f]">
                <span className="flex items-center justify-between gap-2">
                  Corner radius
                  <output>{Math.round(borderRadius)}px</output>
                </span>
                <input
                  name="coverBorderRadius"
                  type="range"
                  min="0"
                  max="64"
                  step="2"
                  value={borderRadius}
                  onChange={(event) =>
                    setBorderRadius(Number(event.target.value))
                  }
                  className="mt-2 block w-full accent-[#006d77]"
                />
              </label>
              <Field label="Border pattern">
                <select
                  name="coverBorderStyle"
                  value={borderStyle}
                  onChange={(event) =>
                    setBorderStyle(
                      event.target.value as CustomPageCoverBorderStyle,
                    )
                  }
                  className={inputClass}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                </select>
              </Field>
              <Field label="Shadow">
                <select
                  name="coverFrameShadow"
                  value={frameShadow}
                  onChange={(event) =>
                    setFrameShadow(event.target.value as CustomPageCoverShadow)
                  }
                  className={inputClass}
                >
                  <option value="none">None</option>
                  <option value="soft">Soft</option>
                  <option value="strong">Strong</option>
                </select>
              </Field>
              <Field label="Border color">
                <span className="flex min-w-0 items-center gap-2 rounded-2xl border border-black/10 bg-white p-2">
                  <input
                    type="color"
                    value={borderColor}
                    aria-label="Cover border color picker"
                    onChange={(event) => setBorderColor(event.target.value)}
                    className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent"
                  />
                  <input
                    name="coverBorderColor"
                    value={borderColor}
                    pattern="#[0-9a-fA-F]{6}"
                    aria-label="Cover border hex value"
                    onChange={(event) => setBorderColor(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-1 font-mono text-xs font-medium uppercase outline-none"
                  />
                </span>
              </Field>
            </div>
          </fieldset>

          <div
            title={
              coverMode === "crop" && visibleCoverUrl
                ? "Drag to position the cover crop"
                : undefined
            }
            onPointerDown={(event) => {
              if (coverMode !== "crop" || !visibleCoverUrl) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              dragStart.current = {
                clientX: event.clientX,
                clientY: event.clientY,
                positionX,
                positionY,
              };
            }}
            onPointerMove={moveCrop}
            onPointerUp={() => {
              dragStart.current = null;
            }}
            onPointerCancel={() => {
              dragStart.current = null;
            }}
            className={`mt-4 ${
              coverMode === "crop" && visibleCoverUrl
                ? "cursor-grab touch-none active:cursor-grabbing"
                : ""
            }`}
          >
            {visibleCoverUrl ? (
              <CustomPageCover
                src={visibleCoverUrl}
                alt=""
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
              />
            ) : (
              <div className="grid aspect-[16/7] place-items-center rounded-2xl border border-black/10 bg-[#f5f1e8] text-[#9b948a]">
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <ImageIcon size={18} />
                  Select an image to preview it
                </span>
              </div>
            )}
          </div>
        </div>

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
        <button className={`${buttonClass} w-fit gap-2`}>
          <FilePlus2 size={16} />
          {page ? "Save page" : "Add page"}
        </button>
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
              {copy.content[previewLocale] ? (
                <MarkdownContent
                  headingOffset={1}
                  className="markdown-preview-page mt-7"
                >
                  {copy.content[previewLocale]}
                </MarkdownContent>
              ) : (
                <p className="mt-7 italic" style={{ color: previewConfig.colors.muted }}>
                  Page content will appear here.
                </p>
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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
