-- CreateTable
CREATE TABLE "CustomPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL DEFAULT '',
    "titleNl" TEXT NOT NULL DEFAULT '',
    "eyebrowEn" TEXT,
    "eyebrowNl" TEXT,
    "supportingTextEn" TEXT,
    "supportingTextNl" TEXT,
    "contentEn" TEXT NOT NULL DEFAULT '',
    "contentNl" TEXT NOT NULL DEFAULT '',
    "coverMediaId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "showInNavigation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomPage_slug_key" ON "CustomPage"("slug");

-- CreateIndex
CREATE INDEX "CustomPage_isPublished_showInNavigation_sortOrder_idx" ON "CustomPage"("isPublished", "showInNavigation", "sortOrder");

-- AddForeignKey
ALTER TABLE "CustomPage" ADD CONSTRAINT "CustomPage_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
