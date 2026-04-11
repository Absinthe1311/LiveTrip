/*
  Warnings:

  - You are about to drop the `Attraction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IoTDevice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IoTLocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Restaurant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `actualAccommod` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `actualFood` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `actualOther` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `actualShopping` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `actualTickets` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `actualTransport` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `aiRecommended` on the `ItineraryItem` table. All the data in the column will be lost.
  - You are about to drop the column `confidenceScore` on the `ItineraryItem` table. All the data in the column will be lost.
  - You are about to drop the column `isAlternative` on the `ItineraryItem` table. All the data in the column will be lost.
  - You are about to drop the column `originalItemId` on the `ItineraryItem` table. All the data in the column will be lost.
  - You are about to drop the column `actualCost` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `aiPrompt` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `iotEnabled` on the `UserPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `locationSharing` on the `UserPreferences` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "IoTDevice_deviceId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Attraction";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "IoTDevice";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "IoTLocation";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Notification";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Restaurant";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "transportation" REAL NOT NULL DEFAULT 0,
    "accommodation" REAL NOT NULL DEFAULT 0,
    "food" REAL NOT NULL DEFAULT 0,
    "tickets" REAL NOT NULL DEFAULT 0,
    "shopping" REAL NOT NULL DEFAULT 0,
    "other" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Budget_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Budget" ("accommodation", "createdAt", "food", "id", "other", "shopping", "tickets", "transportation", "tripId", "updatedAt") SELECT "accommodation", "createdAt", "food", "id", "other", "shopping", "tickets", "transportation", "tripId", "updatedAt" FROM "Budget";
DROP TABLE "Budget";
ALTER TABLE "new_Budget" RENAME TO "Budget";
CREATE UNIQUE INDEX "Budget_tripId_key" ON "Budget"("tripId");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItineraryItem_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ItineraryItem" ("address", "category", "cost", "createdAt", "dayId", "description", "endTime", "id", "latitude", "longitude", "name", "startTime", "type", "updatedAt") SELECT "address", "category", "cost", "createdAt", "dayId", "description", "endTime", "id", "latitude", "longitude", "name", "startTime", "type", "updatedAt" FROM "ItineraryItem";
DROP TABLE "ItineraryItem";
ALTER TABLE "new_ItineraryItem" RENAME TO "ItineraryItem";
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "destination" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "totalBudget" REAL NOT NULL DEFAULT 0,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("aiGenerated", "createdAt", "description", "destination", "endDate", "id", "startDate", "status", "title", "totalBudget", "updatedAt", "userId") SELECT "aiGenerated", "createdAt", "description", "destination", "endDate", "id", "startDate", "status", "title", "totalBudget", "updatedAt", "userId" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
CREATE TABLE "new_UserPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "travelStyle" TEXT NOT NULL DEFAULT 'balanced',
    "budgetRange" TEXT NOT NULL DEFAULT 'medium',
    "accommodation" TEXT NOT NULL DEFAULT 'hotel',
    "transportation" TEXT NOT NULL DEFAULT 'mixed',
    "dietaryPrefs" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserPreferences" ("accommodation", "budgetRange", "createdAt", "dietaryPrefs", "id", "transportation", "travelStyle", "updatedAt", "userId") SELECT "accommodation", "budgetRange", "createdAt", "dietaryPrefs", "id", "transportation", "travelStyle", "updatedAt", "userId" FROM "UserPreferences";
DROP TABLE "UserPreferences";
ALTER TABLE "new_UserPreferences" RENAME TO "UserPreferences";
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
