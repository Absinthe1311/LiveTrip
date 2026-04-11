-- CreateTable
CREATE TABLE "LocationCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'location',
    "category" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "keywords" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 1,
    "cacheTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "LocationCache_keywords_idx" ON "LocationCache"("keywords");

-- CreateIndex
CREATE INDEX "LocationCache_name_idx" ON "LocationCache"("name");
