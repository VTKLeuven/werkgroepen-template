-- Let editors place hero copy in any of the nine common alignment positions.
CREATE TYPE "HeroTextPosition" AS ENUM (
  'topLeft',
  'topCenter',
  'topRight',
  'centerLeft',
  'center',
  'centerRight',
  'bottomLeft',
  'bottomCenter',
  'bottomRight'
);

ALTER TABLE "SiteSettings"
ADD COLUMN "heroTextPosition" "HeroTextPosition" NOT NULL DEFAULT 'bottomLeft';
