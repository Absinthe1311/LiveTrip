-- CreateTable
CREATE TABLE "BlogFavorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlogFavorite_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlogFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "BlogPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BlogFavorite_postId_idx" ON "BlogFavorite"("postId");

-- CreateIndex
CREATE INDEX "BlogFavorite_userId_idx" ON "BlogFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogFavorite_postId_userId_key" ON "BlogFavorite"("postId", "userId");
