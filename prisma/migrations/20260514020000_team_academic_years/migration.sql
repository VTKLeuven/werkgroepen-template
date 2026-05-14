-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMemberYear" (
    "teamMemberId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamMemberYear_pkey" PRIMARY KEY ("teamMemberId","academicYearId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_label_key" ON "AcademicYear"("label");

-- CreateIndex
CREATE INDEX "TeamMemberYear_academicYearId_sortOrder_idx" ON "TeamMemberYear"("academicYearId", "sortOrder");

-- AddForeignKey
ALTER TABLE "TeamMemberYear" ADD CONSTRAINT "TeamMemberYear_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberYear" ADD CONSTRAINT "TeamMemberYear_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill the existing team into the current academic year.
INSERT INTO "AcademicYear" ("id", "label", "sortOrder", "isCurrent", "updatedAt")
VALUES ('current-year', '2025-2026', 2025, true, CURRENT_TIMESTAMP)
ON CONFLICT ("label") DO NOTHING;

INSERT INTO "TeamMemberYear" ("teamMemberId", "academicYearId", "sortOrder")
SELECT "id", 'current-year', "sortOrder"
FROM "TeamMember"
ON CONFLICT ("teamMemberId", "academicYearId") DO NOTHING;
