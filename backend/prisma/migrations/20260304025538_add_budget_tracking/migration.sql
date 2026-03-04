-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "hotelName" TEXT,
    "hotelAddress" TEXT,
    "hotelLocation" TEXT,
    "hotelTel" TEXT,
    "hotelType" TEXT,
    "hotelRating" REAL,
    "actualBudget" REAL NOT NULL DEFAULT 0,
    "budgetStatus" TEXT NOT NULL DEFAULT 'under_budget',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("aiGenerated", "createdAt", "description", "destination", "endDate", "hotelAddress", "hotelLocation", "hotelName", "hotelRating", "hotelTel", "hotelType", "id", "startDate", "status", "title", "totalBudget", "updatedAt", "userId") SELECT "aiGenerated", "createdAt", "description", "destination", "endDate", "hotelAddress", "hotelLocation", "hotelName", "hotelRating", "hotelTel", "hotelType", "id", "startDate", "status", "title", "totalBudget", "updatedAt", "userId" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
