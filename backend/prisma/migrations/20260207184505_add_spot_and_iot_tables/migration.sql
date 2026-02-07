-- CreateTable
CREATE TABLE "Spot" (
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
    "source" TEXT NOT NULL DEFAULT 'amap',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SpotIoTData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotId" TEXT NOT NULL,
    "crowdLevel" REAL NOT NULL,
    "temperature" REAL NOT NULL,
    "rainProbability" REAL NOT NULL,
    "isOpen" BOOLEAN NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpotIoTData_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Spot_amapId_key" ON "Spot"("amapId");

-- CreateIndex
CREATE INDEX "Spot_city_idx" ON "Spot"("city");

-- CreateIndex
CREATE INDEX "Spot_category_idx" ON "Spot"("category");

-- CreateIndex
CREATE INDEX "Spot_amapId_idx" ON "Spot"("amapId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotIoTData_spotId_key" ON "SpotIoTData"("spotId");

-- CreateIndex
CREATE INDEX "SpotIoTData_spotId_idx" ON "SpotIoTData"("spotId");

-- CreateIndex
CREATE INDEX "SpotIoTData_generatedAt_idx" ON "SpotIoTData"("generatedAt");
