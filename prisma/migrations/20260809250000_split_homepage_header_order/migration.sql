ALTER TABLE "SiteSection"
ADD COLUMN "homepageOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "SiteSection"
SET "homepageOrder" = "sortOrder";
