-- CreateTable
CREATE TABLE "AmapPOICache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poiId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "typecode" TEXT NOT NULL,
    "address" TEXT,
    "location" TEXT NOT NULL,
    "tel" TEXT,
    "distance" TEXT,
    "rating" REAL,
    "cost" TEXT,
    "city" TEXT NOT NULL,
    "cacheTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireTime" DATETIME NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AmapPOICache_poiId_key" ON "AmapPOICache"("poiId");
