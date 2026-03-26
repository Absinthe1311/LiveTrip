-- AlterTable
ALTER TABLE "SpotIoTData" ADD COLUMN "weatherDescription" TEXT DEFAULT '';
ALTER TABLE "SpotIoTData" ADD COLUMN "weatherIcon" TEXT DEFAULT '';
ALTER TABLE "SpotIoTData" ADD COLUMN "weatherUpdatedAt" DATETIME;
