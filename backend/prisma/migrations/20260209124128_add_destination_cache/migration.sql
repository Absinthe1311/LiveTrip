-- CreateTable
CREATE TABLE "DestinationCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "attractions" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DestinationCache_city_key" ON "DestinationCache"("city");

-- CreateIndex
CREATE INDEX "DestinationCache_city_idx" ON "DestinationCache"("city");

-- CreateIndex
CREATE INDEX "DestinationCache_expiresAt_idx" ON "DestinationCache"("expiresAt");
