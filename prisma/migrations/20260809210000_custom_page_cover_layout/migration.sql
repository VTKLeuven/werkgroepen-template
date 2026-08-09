-- Give custom-page cover images explicit layout and crop controls.
CREATE TYPE "CoverDisplayMode" AS ENUM ('full', 'fit', 'fill', 'crop');

ALTER TABLE "CustomPage"
ADD COLUMN "coverDisplayMode" "CoverDisplayMode" NOT NULL DEFAULT 'fill',
ADD COLUMN "coverPositionX" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN "coverPositionY" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN "coverZoom" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- Custom pages previously appeared after all fixed section links. Move their
-- existing relative order into the shared global header-order range.
UPDATE "CustomPage"
SET "sortOrder" = "sortOrder" +
  COALESCE((SELECT MAX("sortOrder") + 1 FROM "SiteSection"), 0);
