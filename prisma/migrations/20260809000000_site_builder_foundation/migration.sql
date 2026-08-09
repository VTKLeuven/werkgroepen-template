-- CreateEnum
CREATE TYPE "LanguageMode" AS ENUM ('bilingual', 'englishOnly', 'dutchOnly');

-- CreateEnum
CREATE TYPE "LogoMode" AS ENUM ('iconWithText', 'wordmark');

-- CreateEnum
CREATE TYPE "SectionKey" AS ENUM ('about', 'team', 'events', 'contact', 'partners');

-- Extend site identity settings
ALTER TABLE "SiteSettings"
ADD COLUMN "languageMode" "LanguageMode" NOT NULL DEFAULT 'bilingual',
ADD COLUMN "logoMode" "LogoMode" NOT NULL DEFAULT 'iconWithText',
ADD COLUMN "faviconMediaId" TEXT;

-- Extend typography settings
ALTER TABLE "ThemeSettings"
ADD COLUMN "bodyFontScale" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "headingFontScale" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "heroTitleFontScale" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "heroBodyFontScale" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "SiteSection" (
    "key" "SectionKey" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "showInNavigation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSection_pkey" PRIMARY KEY ("key")
);

-- Seed the fixed public sections in their current display order.
INSERT INTO "SiteSection" ("key", "sortOrder", "isVisible", "showInNavigation", "updatedAt")
VALUES
    ('about', 0, true, true, CURRENT_TIMESTAMP),
    ('team', 1, true, true, CURRENT_TIMESTAMP),
    ('events', 2, true, true, CURRENT_TIMESTAMP),
    ('contact', 3, true, true, CURRENT_TIMESTAMP),
    ('partners', 4, true, true, CURRENT_TIMESTAMP);

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_faviconMediaId_fkey" FOREIGN KEY ("faviconMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
