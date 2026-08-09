import {
  Field,
  inputClass,
  textareaClass,
} from "@/components/admin-shell";
import { MarkdownEditor } from "@/components/markdown-editor";

export type AdminLanguageMode =
  | "bilingual"
  | "englishOnly"
  | "dutchOnly";

export type AdminLocale = "en" | "nl";

export type AdminLanguageConfig = {
  languageMode: AdminLanguageMode;
  defaultLocale: AdminLocale;
};

type LocalizedAdminFieldProps = AdminLanguageConfig & {
  label: string;
  name: string;
  enValue?: string | null;
  nlValue?: string | null;
  fallbackValue?: string | null;
  required?: boolean;
  multiline?: boolean;
  markdown?: boolean;
  preserveEmpty?: boolean;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  className?: string;
};

export function getAdminLanguageConfig(
  settings:
    | { languageMode?: unknown; defaultLocale?: unknown }
    | null
    | undefined,
): AdminLanguageConfig {
  const languageMode =
    settings?.languageMode === "englishOnly" ||
    settings?.languageMode === "dutchOnly"
      ? settings.languageMode
      : "bilingual";

  return {
    languageMode,
    defaultLocale: settings?.defaultLocale === "nl" ? "nl" : "en",
  };
}

export function getAdminContentLocale({
  languageMode,
  defaultLocale,
}: AdminLanguageConfig): AdminLocale {
  if (languageMode === "englishOnly") return "en";
  if (languageMode === "dutchOnly") return "nl";
  return defaultLocale;
}

export function getAdminLocalizedValue(
  config: AdminLanguageConfig,
  english: string | null | undefined,
  dutch: string | null | undefined,
  fallback = "",
) {
  const locale = getAdminContentLocale(config);
  const preferred = locale === "nl" ? dutch : english;
  const secondary = locale === "nl" ? english : dutch;

  return preferred?.trim() || secondary?.trim() || fallback;
}

export function LocalizedAdminField({
  label,
  name,
  languageMode,
  defaultLocale,
  enValue,
  nlValue,
  fallbackValue = "",
  required = false,
  multiline = false,
  markdown = false,
  preserveEmpty = false,
  type = "text",
  placeholder,
  className = "",
}: LocalizedAdminFieldProps) {
  const config = { languageMode, defaultLocale };

  if (languageMode !== "bilingual") {
    const activeLocale = getAdminContentLocale(config);
    const inactiveLocale = activeLocale === "en" ? "nl" : "en";
    const activeValue = preserveEmpty
      ? rawValueForLocale(activeLocale, enValue, nlValue)
      : valueForLocale(activeLocale, enValue, nlValue, fallbackValue);
    const inactiveValue = rawValueForLocale(inactiveLocale, enValue, nlValue);

    return (
      <div className={className}>
        <Field label={label} composite={markdown}>
          <Control
            label={label}
            multiline={multiline}
            markdown={markdown}
            name={`${name}${localeSuffix(activeLocale)}`}
            defaultValue={activeValue}
            required={required}
            type={type}
            placeholder={placeholder}
          />
        </Field>
        <input
          type="hidden"
          name={`${name}${localeSuffix(inactiveLocale)}`}
          value={inactiveValue}
        />
      </div>
    );
  }

  return (
    <div className={`grid gap-4 lg:grid-cols-2 ${className}`}>
      <Field label={`${label} — English`} composite={markdown}>
        <Control
          label={`${label} — English`}
          multiline={multiline}
          markdown={markdown}
          name={`${name}En`}
          defaultValue={
            preserveEmpty
              ? rawValueForLocale("en", enValue, nlValue)
              : valueForLocale("en", enValue, nlValue, fallbackValue)
          }
          required={required}
          type={type}
          placeholder={placeholder}
        />
      </Field>
      <Field label={`${label} — Nederlands`} composite={markdown}>
        <Control
          label={`${label} — Nederlands`}
          multiline={multiline}
          markdown={markdown}
          name={`${name}Nl`}
          defaultValue={
            preserveEmpty
              ? rawValueForLocale("nl", enValue, nlValue)
              : valueForLocale("nl", enValue, nlValue, fallbackValue)
          }
          required={required}
          type={type}
          placeholder={placeholder}
        />
      </Field>
    </div>
  );
}

function Control({
  label,
  multiline,
  markdown,
  name,
  defaultValue,
  required,
  type,
  placeholder,
}: {
  label: string;
  multiline: boolean;
  markdown: boolean;
  name: string;
  defaultValue: string;
  required: boolean;
  type: React.HTMLInputTypeAttribute;
  placeholder?: string;
}) {
  if (markdown) {
    return (
      <MarkdownEditor
        ariaLabel={label}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
      />
    );
  }

  if (multiline) {
    return (
      <textarea
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={textareaClass}
      />
    );
  }

  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      required={required}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

function valueForLocale(
  locale: AdminLocale,
  english: string | null | undefined,
  dutch: string | null | undefined,
  fallback: string | null | undefined,
) {
  const preferred = rawValueForLocale(locale, english, dutch);
  const secondary = rawValueForLocale(
    locale === "en" ? "nl" : "en",
    english,
    dutch,
  );

  return preferred || fallback || secondary;
}

function rawValueForLocale(
  locale: AdminLocale,
  english: string | null | undefined,
  dutch: string | null | undefined,
) {
  return (locale === "en" ? english : dutch) ?? "";
}

function localeSuffix(locale: AdminLocale) {
  return locale === "en" ? "En" : "Nl";
}
