-- CreateTable
CREATE TABLE "SpotAlternative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalSpotId" TEXT NOT NULL,
    "alternativeSpotId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SpotAlternative_originalSpotId_idx" ON "SpotAlternative"("originalSpotId");

-- CreateIndex
CREATE INDEX "SpotAlternative_alternativeSpotId_idx" ON "SpotAlternative"("alternativeSpotId");

-- CreateIndex
CREATE INDEX "SpotAlternative_city_idx" ON "SpotAlternative"("city");

-- CreateIndex
CREATE UNIQUE INDEX "SpotAlternative_originalSpotId_alternativeSpotId_key" ON "SpotAlternative"("originalSpotId", "alternativeSpotId");
