-- Allow custom-page covers to sit beside their content and give the homepage
-- About section an optional image with the same presentation controls.
CREATE TYPE "CoverPlacement" AS ENUM ('above', 'left', 'right');

ALTER TABLE "CustomPage"
ADD COLUMN "coverPlacement" "CoverPlacement" NOT NULL DEFAULT 'above',
ADD COLUMN "coverSideWidth" DOUBLE PRECISION NOT NULL DEFAULT 42;

ALTER TABLE "SiteSettings"
ADD COLUMN "aboutMediaId" TEXT,
ADD COLUMN "aboutCoverDisplayMode" "CoverDisplayMode" NOT NULL DEFAULT 'fill',
ADD COLUMN "aboutCoverWidth" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN "aboutCoverPositionX" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN "aboutCoverPositionY" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN "aboutCoverZoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "aboutCoverBorderWidth" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "aboutCoverBorderStyle" "CoverBorderStyle" NOT NULL DEFAULT 'solid',
ADD COLUMN "aboutCoverBorderColor" TEXT NOT NULL DEFAULT '#231f20',
ADD COLUMN "aboutCoverBorderRadius" DOUBLE PRECISION NOT NULL DEFAULT 32,
ADD COLUMN "aboutCoverFrameShadow" "CoverFrameShadow" NOT NULL DEFAULT 'strong',
ADD COLUMN "aboutCoverColumnWidth" DOUBLE PRECISION NOT NULL DEFAULT 42;

ALTER TABLE "SiteSettings"
ADD CONSTRAINT "SiteSettings_aboutMediaId_fkey"
FOREIGN KEY ("aboutMediaId") REFERENCES "MediaAsset"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
