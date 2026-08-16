-- AlterEnum
ALTER TYPE "SectionKey" ADD VALUE 'photos';

-- CreateTable
CREATE TABLE "PhotoAlbum" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL DEFAULT '',
    "titleNl" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT,
    "descriptionNl" TEXT,
    "takenOn" TIMESTAMP(3),
    "coverPhotoId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "thumbName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "thumbSize" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoAlbum_slug_key" ON "PhotoAlbum"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoAlbum_coverPhotoId_key" ON "PhotoAlbum"("coverPhotoId");

-- CreateIndex
CREATE INDEX "PhotoAlbum_isPublished_sortOrder_idx" ON "PhotoAlbum"("isPublished", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_fileName_key" ON "Photo"("fileName");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_thumbName_key" ON "Photo"("thumbName");

-- CreateIndex
CREATE INDEX "Photo_albumId_sortOrder_idx" ON "Photo"("albumId", "sortOrder");

-- AddForeignKey
ALTER TABLE "PhotoAlbum" ADD CONSTRAINT "PhotoAlbum_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "PhotoAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
