-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'nl');

-- Site settings translations and default language
ALTER TABLE "SiteSettings" ADD COLUMN "defaultLocale" "Locale" NOT NULL DEFAULT 'en';
ALTER TABLE "SiteSettings" ADD COLUMN "siteNameEn" TEXT NOT NULL DEFAULT 'Chemix';
ALTER TABLE "SiteSettings" ADD COLUMN "siteNameNl" TEXT NOT NULL DEFAULT 'Chemix';
ALTER TABLE "SiteSettings" ADD COLUMN "headerNameEn" TEXT NOT NULL DEFAULT 'Chemix';
ALTER TABLE "SiteSettings" ADD COLUMN "headerNameNl" TEXT NOT NULL DEFAULT 'Chemix';
ALTER TABLE "SiteSettings" ADD COLUMN "heroEyebrowEn" TEXT NOT NULL DEFAULT 'VTK subdivision';
ALTER TABLE "SiteSettings" ADD COLUMN "heroEyebrowNl" TEXT NOT NULL DEFAULT 'VTK werkgroep';
ALTER TABLE "SiteSettings" ADD COLUMN "heroTitleEn" TEXT NOT NULL DEFAULT 'A student community for curious engineers';
ALTER TABLE "SiteSettings" ADD COLUMN "heroTitleNl" TEXT NOT NULL DEFAULT 'Een studentencommunity voor nieuwsgierige ingenieurs';
ALTER TABLE "SiteSettings" ADD COLUMN "heroSloganEn" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "heroSloganNl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "heroButtonTextEn" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "heroButtonTextNl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "aboutTitleEn" TEXT NOT NULL DEFAULT 'About us';
ALTER TABLE "SiteSettings" ADD COLUMN "aboutTitleNl" TEXT NOT NULL DEFAULT 'Over ons';
ALTER TABLE "SiteSettings" ADD COLUMN "aboutTextEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "aboutTextNl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "contactTitleEn" TEXT NOT NULL DEFAULT 'Contact us';
ALTER TABLE "SiteSettings" ADD COLUMN "contactTitleNl" TEXT NOT NULL DEFAULT 'Contacteer ons';
ALTER TABLE "SiteSettings" ADD COLUMN "contactTextEn" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "contactTextNl" TEXT;

UPDATE "SiteSettings"
SET
  "siteNameEn" = "siteName",
  "siteNameNl" = "siteName",
  "headerNameEn" = "headerName",
  "headerNameNl" = "headerName",
  "heroEyebrowEn" = "heroEyebrow",
  "heroEyebrowNl" = "heroEyebrow",
  "heroTitleEn" = "heroTitle",
  "heroTitleNl" = "heroTitle",
  "heroSloganEn" = "heroSlogan",
  "heroSloganNl" = "heroSlogan",
  "heroButtonTextEn" = "heroButtonText",
  "heroButtonTextNl" = "heroButtonText",
  "aboutTitleEn" = "aboutTitle",
  "aboutTitleNl" = "aboutTitle",
  "aboutTextEn" = "aboutText",
  "aboutTextNl" = "aboutText",
  "contactTitleEn" = "contactTitle",
  "contactTitleNl" = "contactTitle",
  "contactTextEn" = "contactText",
  "contactTextNl" = "contactText";

-- Team translations
ALTER TABLE "TeamMember" ADD COLUMN "functionNameEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "TeamMember" ADD COLUMN "functionNameNl" TEXT NOT NULL DEFAULT '';
UPDATE "TeamMember"
SET "functionNameEn" = "functionName", "functionNameNl" = "functionName";

-- Event translations
ALTER TABLE "Event" ADD COLUMN "titleEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Event" ADD COLUMN "titleNl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Event" ADD COLUMN "summaryEn" TEXT;
ALTER TABLE "Event" ADD COLUMN "summaryNl" TEXT;
ALTER TABLE "Event" ADD COLUMN "descriptionEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Event" ADD COLUMN "descriptionNl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Event" ADD COLUMN "locationEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Event" ADD COLUMN "locationNl" TEXT NOT NULL DEFAULT '';
UPDATE "Event"
SET
  "titleEn" = "title",
  "titleNl" = "title",
  "summaryEn" = "summary",
  "summaryNl" = "summary",
  "descriptionEn" = "description",
  "descriptionNl" = "description",
  "locationEn" = "location",
  "locationNl" = "location";

-- Partner translations
ALTER TABLE "Partner" ADD COLUMN "nameEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Partner" ADD COLUMN "nameNl" TEXT NOT NULL DEFAULT '';
UPDATE "Partner" SET "nameEn" = "name", "nameNl" = "name";
