-- Migration: Add Image Management Fields
-- This migration adds image management features to the database

-- Step 1: Add role column to User table (with default value)
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- Step 2: Modify SpotImage table - add new columns with default values for existing data

-- First, add the url column
ALTER TABLE "SpotImage" ADD COLUMN "url" TEXT;

-- Then add the optional columns (source already exists from previous migration)
ALTER TABLE "SpotImage" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE "SpotImage" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "SpotImage" ADD COLUMN "fileHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SpotImage" ADD COLUMN "uploadedBy" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "SpotImage" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "SpotImage" ADD COLUMN "reviewedAt" TEXT;
ALTER TABLE "SpotImage" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "SpotImage" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SpotImage" ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SpotImage" ADD COLUMN "reportCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SpotImage" ADD COLUMN "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 3: Migrate existing imageUrl to url column
UPDATE "SpotImage" SET "url" = "imageUrl" WHERE "imageUrl" IS NOT NULL;

-- Step 4: Drop the old imageUrl column (after migration)
-- Note: This will be done after we ensure url column is populated
ALTER TABLE "SpotImage" DROP COLUMN "imageUrl";

-- Step 5: Add imageIds column to BlogPost table
ALTER TABLE "BlogPost" ADD COLUMN "imageIds" TEXT;

-- Step 6: Add review columns to BlogPost table
ALTER TABLE "BlogPost" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "BlogPost" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "reviewedAt" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "reviewNote" TEXT;

-- Step 7: Create indexes for SpotImage table
CREATE INDEX "SpotImage_source_idx" ON "SpotImage"("source");
CREATE INDEX "SpotImage_status_idx" ON "SpotImage"("status");
CREATE INDEX "SpotImage_priority_idx" ON "SpotImage"("priority");
CREATE INDEX "SpotImage_uploadedBy_idx" ON "SpotImage"("uploadedBy");

-- Step 8: Create unique index for SpotImage (spotId, fileHash)
-- Note: This might fail if there are duplicates, but we'll handle it
CREATE UNIQUE INDEX IF NOT EXISTS "SpotImage_spotId_fileHash_key" ON "SpotImage"("spotId", "fileHash");

-- Step 9: Create index for BlogPost status
CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");

-- Step 10: Set updatedAt for existing SpotImage records
UPDATE "SpotImage" SET "updatedAt" = "createdAt" WHERE "updatedAt" = CURRENT_TIMESTAMP;
