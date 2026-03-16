-- CreateTable
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "location" TEXT NOT NULL,
    "tel" TEXT,
    "type" TEXT NOT NULL,
    "rating" REAL,
    "city" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "location" TEXT NOT NULL,
    "tel" TEXT,
    "type" TEXT NOT NULL,
    "rating" REAL,
    "city" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ItineraryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT DEFAULT '',
    "description" TEXT DEFAULT '',
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "address" TEXT DEFAULT '',
    "latitude" REAL,
    "longitude" REAL,
    "cost" REAL NOT NULL DEFAULT 0,
    "spotId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItineraryItem_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItineraryItem_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ItineraryItem" ("address", "category", "cost", "createdAt", "dayId", "description", "endTime", "id", "latitude", "longitude", "name", "spotId", "startTime", "type", "updatedAt") SELECT "address", "category", "cost", "createdAt", "dayId", "description", "endTime", "id", "latitude", "longitude", "name", "spotId", "startTime", "type", "updatedAt" FROM "ItineraryItem";
DROP TABLE "ItineraryItem";
ALTER TABLE "new_ItineraryItem" RENAME TO "ItineraryItem";
CREATE INDEX "ItineraryItem_spotId_idx" ON "ItineraryItem"("spotId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Hotel_amapId_key" ON "Hotel"("amapId");

-- CreateIndex
CREATE INDEX "Hotel_city_idx" ON "Hotel"("city");

-- CreateIndex
CREATE INDEX "Hotel_location_idx" ON "Hotel"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_amapId_key" ON "Restaurant"("amapId");

-- CreateIndex
CREATE INDEX "Restaurant_city_idx" ON "Restaurant"("city");

-- CreateIndex
CREATE INDEX "Restaurant_location_idx" ON "Restaurant"("location");
