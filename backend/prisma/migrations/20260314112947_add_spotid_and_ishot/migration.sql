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
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "coverImage" TEXT,
    "avgRating" REAL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'amap',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Spot" ("address", "amapId", "avgRating", "category", "city", "coverImage", "createdAt", "description", "id", "isOutdoor", "location", "name", "openTime", "rating", "reviewCount", "source", "ticketPrice", "updatedAt") SELECT "address", "amapId", "avgRating", "category", "city", "coverImage", "createdAt", "description", "id", "isOutdoor", "location", "name", "openTime", "rating", "reviewCount", "source", "ticketPrice", "updatedAt" FROM "Spot";
DROP TABLE "Spot";
ALTER TABLE "new_Spot" RENAME TO "Spot";
CREATE UNIQUE INDEX "Spot_amapId_key" ON "Spot"("amapId");
CREATE INDEX "Spot_city_idx" ON "Spot"("city");
CREATE INDEX "Spot_category_idx" ON "Spot"("category");
CREATE INDEX "Spot_amapId_idx" ON "Spot"("amapId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
