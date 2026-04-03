-- CreateTable
CREATE TABLE "CollabRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'EDITING',
    "inviteToken" TEXT NOT NULL,
    "inviteExpiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CollabRoom_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollabRoom_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COLLABORATOR',
    "assignedDays" TEXT NOT NULL DEFAULT '[]',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CollabRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DraftRoute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "spotSequence" TEXT NOT NULL,
    "polylineData" TEXT NOT NULL,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DraftRoute_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CollabRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DraftRoute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollabMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollabMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CollabRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollabMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CollabRoom_tripId_key" ON "CollabRoom"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "CollabRoom_inviteToken_key" ON "CollabRoom"("inviteToken");

-- CreateIndex
CREATE INDEX "CollabRoom_hostId_idx" ON "CollabRoom"("hostId");

-- CreateIndex
CREATE INDEX "CollabRoom_inviteToken_idx" ON "CollabRoom"("inviteToken");

-- CreateIndex
CREATE INDEX "TripMember_roomId_idx" ON "TripMember"("roomId");

-- CreateIndex
CREATE INDEX "TripMember_userId_idx" ON "TripMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TripMember_roomId_userId_key" ON "TripMember"("roomId", "userId");

-- CreateIndex
CREATE INDEX "DraftRoute_roomId_idx" ON "DraftRoute"("roomId");

-- CreateIndex
CREATE INDEX "DraftRoute_userId_idx" ON "DraftRoute"("userId");

-- CreateIndex
CREATE INDEX "DraftRoute_dayNumber_idx" ON "DraftRoute"("dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DraftRoute_roomId_userId_dayNumber_key" ON "DraftRoute"("roomId", "userId", "dayNumber");

-- CreateIndex
CREATE INDEX "CollabMessage_roomId_idx" ON "CollabMessage"("roomId");

-- CreateIndex
CREATE INDEX "CollabMessage_userId_idx" ON "CollabMessage"("userId");

-- CreateIndex
CREATE INDEX "CollabMessage_createdAt_idx" ON "CollabMessage"("createdAt");
