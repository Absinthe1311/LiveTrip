-- CreateTable
CREATE TABLE "SpotImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'unsplash',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "altText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpotImage_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Spot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "category" TEXT,
    "ticketPrice" REAL DEFAULT 0,
    "openTime" TEXT,
    "rating" REAL,
    "description" TEXT,
    "isOutdoor" BOOLEAN DEFAULT true,
    "coverImage" TEXT,
    "avgRating" REAL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'amap',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Spot" ("address", "amapId", "category", "city", "createdAt", "description", "id", "isOutdoor", "location", "name", "openTime", "rating", "source", "ticketPrice", "updatedAt") SELECT "address", "amapId", "category", "city", "createdAt", "description", "id", "isOutdoor", "location", "name", "openTime", "rating", "source", "ticketPrice", "updatedAt" FROM "Spot";
DROP TABLE "Spot";
ALTER TABLE "new_Spot" RENAME TO "Spot";
CREATE UNIQUE INDEX "Spot_amapId_key" ON "Spot"("amapId");
CREATE INDEX "Spot_city_idx" ON "Spot"("city");
CREATE INDEX "Spot_category_idx" ON "Spot"("category");
CREATE INDEX "Spot_amapId_idx" ON "Spot"("amapId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SpotImage_spotId_idx" ON "SpotImage"("spotId");

-- CreateIndex
CREATE INDEX "SpotImage_isPrimary_idx" ON "SpotImage"("isPrimary");

-- CreateIndex
CREATE INDEX "Review_spotId_idx" ON "Review"("spotId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "ReviewImage_reviewId_idx" ON "ReviewImage"("reviewId");
