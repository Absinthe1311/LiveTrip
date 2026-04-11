-- AlterTable
ALTER TABLE "Day" ADD COLUMN "restaurantRecommendationsCache" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "hotelRecommendationsCache" TEXT DEFAULT '';
