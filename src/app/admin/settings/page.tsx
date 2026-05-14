import { Save } from "lucide-react";
import {
  AdminShell,
  Field,
  Panel,
  buttonClass,
  inputClass,
  textareaClass,
} from "@/components/admin-shell";
import { updateSettings } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin";
import { getSiteData } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const [{ settings, theme }, params] = await Promise.all([
    getSiteData(),
    searchParams,
  ]);

  return (
    <AdminShell title="Settings">
      <form action={updateSettings} className="grid gap-6">
        {params.saved ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Settings saved.
          </p>
        ) : null}

        <Panel
          title="Identity"
          description="Controls the header name, logo, and first impression of the site."
        >
          <div className="mb-4 max-w-xs">
            <Field label="Default public language">
              <select
                name="defaultLocale"
                defaultValue={settings.defaultLocale}
                className={inputClass}
              >
                <option value="en">English</option>
                <option value="nl">Dutch</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Site name EN">
              <input
                name="siteNameEn"
                required
                defaultValue={settings.siteNameEn}
                className={inputClass}
              />
            </Field>
            <Field label="Site name NL">
              <input
                name="siteNameNl"
                required
                defaultValue={settings.siteNameNl}
                className={inputClass}
              />
            </Field>
            <Field label="Header name EN">
              <input
                name="headerNameEn"
                required
                defaultValue={settings.headerNameEn}
                className={inputClass}
              />
            </Field>
            <Field label="Header name NL">
              <input
                name="headerNameNl"
                required
                defaultValue={settings.headerNameNl}
                className={inputClass}
              />
            </Field>
            <Field label="Logo image">
              <input name="logo" type="file" accept="image/*" className={inputClass} />
            </Field>
            <Field label="Hero photo">
              <input name="hero" type="file" accept="image/*" className={inputClass} />
            </Field>
          </div>
        </Panel>

        <Panel title="Hero">
          <div className="grid gap-4">
            <TranslatedInput
              label="Eyebrow"
              name="heroEyebrow"
              en={settings.heroEyebrowEn}
              nl={settings.heroEyebrowNl}
            />
            <TranslatedInput
              label="Title"
              name="heroTitle"
              en={settings.heroTitleEn}
              nl={settings.heroTitleNl}
            />
            <TranslatedTextarea
              label="Slogan"
              name="heroSlogan"
              en={settings.heroSloganEn ?? ""}
              nl={settings.heroSloganNl ?? ""}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Button text EN">
                <input
                  name="heroButtonTextEn"
                  defaultValue={settings.heroButtonTextEn ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label="Button text NL">
                <input
                  name="heroButtonTextNl"
                  defaultValue={settings.heroButtonTextNl ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label="Button link">
                <input
                  name="heroButtonUrl"
                  defaultValue={settings.heroButtonUrl ?? ""}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </Panel>

        <Panel title="About">
          <div className="grid gap-4">
            <TranslatedInput
              label="Title"
              name="aboutTitle"
              en={settings.aboutTitleEn}
              nl={settings.aboutTitleNl}
            />
            <TranslatedTextarea
              label="Text"
              name="aboutText"
              en={settings.aboutTextEn}
              nl={settings.aboutTextNl}
              required
            />
          </div>
        </Panel>

        <Panel title="Contact and socials">
          <div className="grid gap-4">
            <TranslatedInput
              label="Title"
              name="contactTitle"
              en={settings.contactTitleEn}
              nl={settings.contactTitleNl}
            />
            <TranslatedTextarea
              label="Short text"
              name="contactText"
              en={settings.contactTextEn ?? ""}
              nl={settings.contactTextNl ?? ""}
            />
            <Field label="Email">
              <input
                name="contactEmail"
                type="email"
                required
                defaultValue={settings.contactEmail}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="Facebook URL">
                <input
                  name="facebookUrl"
                  type="url"
                  defaultValue={settings.facebookUrl ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label="Instagram URL">
                <input
                  name="instagramUrl"
                  type="url"
                  defaultValue={settings.instagramUrl ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label="LinkedIn URL">
                <input
                  name="linkedinUrl"
                  type="url"
                  defaultValue={settings.linkedinUrl ?? ""}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </Panel>

        <Panel title="Theme colors">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ColorField label="Background" name="backgroundColor" value={theme.backgroundColor} />
            <ColorField label="Surface" name="surfaceColor" value={theme.surfaceColor} />
            <ColorField label="Text" name="textColor" value={theme.textColor} />
            <ColorField label="Muted" name="mutedColor" value={theme.mutedColor} />
            <ColorField label="Primary" name="primaryColor" value={theme.primaryColor} />
            <ColorField label="Accent" name="accentColor" value={theme.accentColor} />
            <ColorField label="Header" name="headerColor" value={theme.headerColor} />
          </div>
        </Panel>

        <button className={`${buttonClass} w-fit gap-2`}>
          <Save size={16} />
          Save settings
        </button>
      </form>
    </AdminShell>
  );
}

function ColorField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#3a352f]">
      <span>{label}</span>
      <span className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2">
        <input name={name} type="color" defaultValue={value} className="h-9 w-10" />
        <span className="text-xs text-[#6f6860]">{value}</span>
      </span>
    </label>
  );
}

function TranslatedInput({
  label,
  name,
  en,
  nl,
}: {
  label: string;
  name: string;
  en: string;
  nl: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Field label={`${label} EN`}>
        <input name={`${name}En`} required defaultValue={en} className={inputClass} />
      </Field>
      <Field label={`${label} NL`}>
        <input name={`${name}Nl`} required defaultValue={nl} className={inputClass} />
      </Field>
    </div>
  );
}

function TranslatedTextarea({
  label,
  name,
  en,
  nl,
  required = false,
}: {
  label: string;
  name: string;
  en: string;
  nl: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Field label={`${label} EN`}>
        <textarea
          name={`${name}En`}
          required={required}
          defaultValue={en}
          className={textareaClass}
        />
      </Field>
      <Field label={`${label} NL`}>
        <textarea
          name={`${name}Nl`}
          required={required}
          defaultValue={nl}
          className={textareaClass}
        />
      </Field>
    </div>
  );
}
