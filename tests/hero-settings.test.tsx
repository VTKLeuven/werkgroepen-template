import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SettingsEditor } from "../src/components/settings-editor";
import { PublicSite } from "../src/components/public-site";
import { defaultSettings, defaultTheme, defaultSections } from "../src/lib/site";

const mockInitial = {
  languageMode: "bilingual" as const,
  defaultLocale: "en" as const,
  logoMode: "iconWithText" as const,
  copy: {
    siteName: { en: "Chemix", nl: "Chemix" },
    headerName: { en: "Chemix", nl: "Chemix" },
    heroEyebrow: { en: "VTK subdivision", nl: "VTK werkgroep" },
    heroTitle: { en: "Headline", nl: "Koptekst" },
    heroSlogan: { en: "Slogan", nl: "Slogan" },
    heroButtonText: { en: "Button", nl: "Knop" },
    aboutTitle: { en: "About", nl: "Over" },
    aboutText: { en: "About text", nl: "Over tekst" },
    contactTitle: { en: "Contact", nl: "Contact" },
    contactText: { en: "Contact text", nl: "Contact tekst" },
  },
  heroButtonUrl: "#events",
  heroTextPosition: "bottomLeft" as const,
  heroOverlayIntensity: 70,
  contactEmail: "hello@example.org",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  logoUrl: null,
  logoName: null,
  heroUrl: "/hero.jpg",
  heroName: "hero.jpg",
  aboutImageUrl: null,
  aboutImageName: null,
  aboutCover: {
    mode: "fill" as const,
    width: 100,
    positionX: 50,
    positionY: 50,
    zoom: 1,
    borderWidth: 0,
    borderStyle: "solid" as const,
    borderColor: "#231f20",
    borderRadius: 32,
    shadow: "strong" as const,
  },
  aboutCoverColumnWidth: 42,
  faviconUrl: null,
  faviconName: null,
  colors: {
    backgroundColor: "#f7f3ec",
    surfaceColor: "#fffaf2",
    textColor: "#231f20",
    mutedColor: "#6f6860",
    primaryColor: "#006d77",
    accentColor: "#f4a261",
    headerColor: "#fffaf2",
  },
  typography: {
    bodyFontScale: 1,
    headingFontScale: 1,
    heroTitleFontScale: 1,
    heroBodyFontScale: 1,
  },
  homepageSections: [],
  headerNavigationItems: [],
  previewContent: {
    team: [],
    events: [],
    partners: [],
  },
  customPageLinks: [],
};

test("settings editor renders range control for hero overlay intensity in homepage view", () => {
  const html = renderToStaticMarkup(
    <SettingsEditor
      initial={mockInitial}
      saved={false}
      view="homepage"
      returnTo="/admin/homepage"
      initialShowPreview
    />,
  );

  assert.match(html, /name="heroOverlayIntensity"/);
  assert.match(html, /type="range"/);
  assert.match(html, /min="0"/);
  assert.match(html, /max="100"/);
  assert.match(html, /value="70"/);
  assert.match(html, /70%/);
  // Live admin preview has gradient overlay
  assert.match(
    html,
    /linear-gradient\(to right, rgba\(0, 0, 0, 0\.7\), rgba\(0, 0, 0, 0\.35\), rgba\(0, 0, 0, 0\.1\)\)/,
  );
});

test("public site renders hero overlay with configured overlay intensity", () => {
  const siteData = {
    settings: {
      ...defaultSettings,
      heroMediaId: "hero-1",
      heroTextPosition: "topRight" as const,
      heroOverlayIntensity: 35,
    },
    theme: defaultTheme,
    sections: defaultSections,
    currentAcademicYear: null,
    teamMembers: [],
    events: [],
    partners: [],
    customPages: [],
    photoAlbums: [],
  };

  const html = renderToStaticMarkup(
    <PublicSite data={siteData} locale="en" />,
  );

  // Checks that dynamic inline style is rendered with scaled stops (35% intensity)
  assert.match(
    html,
    /linear-gradient\(to left, rgba\(0, 0, 0, 0\.35\), rgba\(0, 0, 0, 0\.175\), rgba\(0, 0, 0, 0\.05\)\)/,
  );
});

test("public site supports center alignment radial overlay and transparent 0 intensity", () => {
  const centerSiteData = {
    settings: {
      ...defaultSettings,
      heroMediaId: "hero-1",
      heroTextPosition: "center" as const,
      heroOverlayIntensity: 70,
    },
    theme: defaultTheme,
    sections: defaultSections,
    currentAcademicYear: null,
    teamMembers: [],
    events: [],
    partners: [],
    customPages: [],
    photoAlbums: [],
  };

  const centerHtml = renderToStaticMarkup(
    <PublicSite data={centerSiteData} locale="en" />,
  );

  assert.match(
    centerHtml,
    /radial-gradient\(circle at center, rgba\(0, 0, 0, 0\.62\), rgba\(0, 0, 0, 0\.16\) 72%\)/,
  );

  const transparentSiteData = {
    settings: {
      ...defaultSettings,
      heroMediaId: "hero-1",
      heroTextPosition: "bottomLeft" as const,
      heroOverlayIntensity: 0,
    },
    theme: defaultTheme,
    sections: defaultSections,
    currentAcademicYear: null,
    teamMembers: [],
    events: [],
    partners: [],
    customPages: [],
    photoAlbums: [],
  };

  const transparentHtml = renderToStaticMarkup(
    <PublicSite data={transparentSiteData} locale="en" />,
  );

  assert.match(
    transparentHtml,
    /linear-gradient\(to right, rgba\(0, 0, 0, 0\), rgba\(0, 0, 0, 0\), rgba\(0, 0, 0, 0\)\)/,
  );
});
