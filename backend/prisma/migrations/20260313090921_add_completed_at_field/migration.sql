/*
  Warnings:

  - You are about to alter the column `reviewedAt` on the `BlogPost` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to drop the column `altText` on the `SpotImage` table. All the data in the column will be lost.
  - You are about to alter the column `reviewedAt` on the `SpotImage` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `updatedAt` on the `SpotImage` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "completedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "tags" TEXT NOT NULL,
    "city" TEXT,
    "spotIds" TEXT,
    "imageIds" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BlogPost_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BlogPost" ("city", "commentCount", "content", "coverImage", "createdAt", "id", "imageIds", "isPublished", "likeCount", "publishedAt", "reviewNote", "reviewedAt", "reviewedBy", "spotIds", "status", "tags", "title", "updatedAt", "userId", "viewCount") SELECT "city", "commentCount", "content", "coverImage", "createdAt", "id", "imageIds", "isPublished", "likeCount", "publishedAt", "reviewNote", "reviewedAt", "reviewedBy", "spotIds", "status", "tags", "title", "updatedAt", "userId", "viewCount" FROM "BlogPost";
DROP TABLE "BlogPost";
ALTER TABLE "new_BlogPost" RENAME TO "BlogPost";
CREATE INDEX "BlogPost_userId_idx" ON "BlogPost"("userId");
CREATE INDEX "BlogPost_city_idx" ON "BlogPost"("city");
CREATE INDEX "BlogPost_isPublished_idx" ON "BlogPost"("isPublished");
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");
CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");
CREATE TABLE "new_SpotImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotId" TEXT NOT NULL,
    "url" TEXT DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'unsplash',
    "status" TEXT NOT NULL DEFAULT 'approved',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "fileHash" TEXT NOT NULL DEFAULT '',
    "uploadedBy" TEXT NOT NULL DEFAULT 'system',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "reviewNote" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpotImage_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SpotImage_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SpotImage_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SpotImage" ("createdAt", "fileHash", "id", "isPrimary", "likeCount", "priority", "reportCount", "reviewNote", "reviewedAt", "reviewedBy", "source", "spotId", "status", "updatedAt", "uploadedBy", "url", "viewCount") SELECT "createdAt", "fileHash", "id", "isPrimary", "likeCount", "priority", "reportCount", "reviewNote", "reviewedAt", "reviewedBy", "source", "spotId", "status", "updatedAt", "uploadedBy", "url", "viewCount" FROM "SpotImage";
DROP TABLE "SpotImage";
ALTER TABLE "new_SpotImage" RENAME TO "SpotImage";
CREATE INDEX "SpotImage_spotId_idx" ON "SpotImage"("spotId");
CREATE INDEX "SpotImage_source_idx" ON "SpotImage"("source");
CREATE INDEX "SpotImage_status_idx" ON "SpotImage"("status");
CREATE INDEX "SpotImage_priority_idx" ON "SpotImage"("priority");
CREATE INDEX "SpotImage_uploadedBy_idx" ON "SpotImage"("uploadedBy");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
