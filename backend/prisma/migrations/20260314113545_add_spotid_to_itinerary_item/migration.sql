-- Add spotId field to ItineraryItem
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ItineraryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "cost" REAL NOT NULL DEFAULT 0,
    "spotId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ItineraryItem" ("id", "dayId", "name", "type", "category", "description", "startTime", "endTime", "address", "latitude", "longitude", "cost", "createdAt", "updatedAt") SELECT "id", "dayId", "name", "type", "category", "description", "startTime", "endTime", "address", "latitude", "longitude", "cost", "createdAt", "updatedAt" FROM "ItineraryItem";
DROP TABLE "ItineraryItem";
ALTER TABLE "new_ItineraryItem" RENAME TO "ItineraryItem";
CREATE INDEX "ItineraryItem_dayId_idx" ON "ItineraryItem"("dayId");
CREATE INDEX "ItineraryItem_spotId_idx" ON "ItineraryItem"("spotId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;