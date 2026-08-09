-- Add a naturally sized cover option and configurable frame presentation.
ALTER TYPE "CoverDisplayMode" ADD VALUE 'flexible';

CREATE TYPE "CoverBorderStyle" AS ENUM ('solid', 'dashed', 'dotted', 'double');
CREATE TYPE "CoverFrameShadow" AS ENUM ('none', 'soft', 'strong');

ALTER TABLE "CustomPage"
ADD COLUMN "coverWidth" DOUBLE PRECISION NOT NULL DEFAULT 75,
ADD COLUMN "coverBorderWidth" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "coverBorderStyle" "CoverBorderStyle" NOT NULL DEFAULT 'solid',
ADD COLUMN "coverBorderColor" TEXT NOT NULL DEFAULT '#231f20',
ADD COLUMN "coverBorderRadius" DOUBLE PRECISION NOT NULL DEFAULT 32,
ADD COLUMN "coverFrameShadow" "CoverFrameShadow" NOT NULL DEFAULT 'strong';
