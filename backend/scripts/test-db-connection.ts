/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and performs basic operations
 * to verify that the database is working correctly.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing Database Connection...\n');

  try {
    // Test 1: Connect to database
    console.log('✅ Test 1: Connecting to database...');
    await prisma.$connect();
    console.log('   ✓ Connected successfully!\n');

    // Test 2: Create a test user
    console.log('✅ Test 2: Creating a test user...');
    const testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed_password_here',
      },
    });
    console.log(`   ✓ Created user with ID: ${testUser.id}\n`);

    // Test 3: Create user preferences
    console.log('✅ Test 3: Creating user preferences...');
    const testPreferences = await prisma.userPreferences.create({
      data: {
        userId: testUser.id,
        travelStyle: 'adventure',
        budgetRange: 'medium',
        accommodation: 'hotel',
        transportation: 'mixed',
        dietaryPrefs: 'vegetarian,gluten-free',
        iotEnabled: true,
        locationSharing: false,
      },
    });
    console.log(`   ✓ Created preferences with ID: ${testPreferences.id}\n`);

    // Test 4: Create a test trip
    console.log('✅ Test 4: Creating a test trip...');
    const testTrip = await prisma.trip.create({
      data: {
        userId: testUser.id,
        title: 'Test Trip to Paris',
        description: 'A wonderful trip to the City of Light',
        destination: 'Paris, France',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-07'),
        status: 'planning',
        totalBudget: 5000,
        aiGenerated: true,
        aiPrompt: 'Plan a romantic trip to Paris',
      },
    });
    console.log(`   ✓ Created trip with ID: ${testTrip.id}\n`);

    // Test 5: Create trip days
    console.log('✅ Test 5: Creating trip days...');
    const day1 = await prisma.day.create({
      data: {
        tripId: testTrip.id,
        dayNumber: 1,
        date: new Date('2025-04-01'),
        notes: 'Arrival day',
      },
    });
    console.log(`   ✓ Created day with ID: ${day1.id}\n`);

    // Test 6: Create itinerary items
    console.log('✅ Test 6: Creating itinerary items...');
    const item1 = await prisma.itineraryItem.create({
      data: {
        dayId: day1.id,
        name: 'Eiffel Tower',
        type: 'attraction',
        category: 'landmark',
        description: 'The iconic iron tower',
        startTime: new Date('2025-04-01T09:00:00'),
        endTime: new Date('2025-04-01T12:00:00'),
        address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
        latitude: 48.8584,
        longitude: 2.2945,
        cost: 25,
        aiRecommended: true,
        confidenceScore: 0.95,
      },
    });
    console.log(`   ✓ Created itinerary item with ID: ${item1.id}\n`);

    // Test 7: Create budget
    console.log('✅ Test 7: Creating budget...');
    const budget = await prisma.budget.create({
      data: {
        tripId: testTrip.id,
        transportation: 1000,
        accommodation: 2000,
        food: 1000,
        tickets: 500,
        shopping: 300,
        other: 200,
      },
    });
    console.log(`   ✓ Created budget with ID: ${budget.id}\n`);

    // Test 8: Create attraction
    console.log('✅ Test 8: Creating attraction...');
    const attraction = await prisma.attraction.create({
      data: {
        name: 'Louvre Museum',
        type: 'museum',
        category: 'art',
        description: 'The world\'s largest art museum',
        city: 'Paris',
        address: 'Rue de Rivoli, 75001 Paris',
        latitude: 48.8606,
        longitude: 2.3376,
        rating: 4.7,
        reviewCount: 150000,
        ticketPrice: 17,
        openingHours: '9:00-18:00',
        recommendedDuration: 180,
        tags: 'art,museum,historic,iconic',
        bestSeason: 'all',
      },
    });
    console.log(`   ✓ Created attraction with ID: ${attraction.id}\n`);

    // Test 9: Create restaurant
    console.log('✅ Test 9: Creating restaurant...');
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Le Petit Cler',
        cuisine: 'french',
        type: 'casual',
        description: 'Cozy French bistro',
        city: 'Paris',
        address: '29 Rue Cler, 75007 Paris',
        latitude: 48.8566,
        longitude: 2.3122,
        rating: 4.3,
        reviewCount: 2500,
        priceRange: 'medium',
        avgPrice: 35,
        openingHours: '12:00-22:00',
        tags: 'french,bistro,romantic',
      },
    });
    console.log(`   ✓ Created restaurant with ID: ${restaurant.id}\n`);

    // Test 10: Create IoT device
    console.log('✅ Test 10: Creating IoT device...');
    const iotDevice = await prisma.ioTDevice.create({
      data: {
        userId: testUser.id,
        deviceId: 'tracker-001',
        deviceType: 'tracker',
        deviceName: 'My Tracker',
        status: 'active',
        lastLatitude: 48.8566,
        lastLongitude: 2.3522,
        lastLocationAt: new Date(),
        batteryLevel: 85,
      },
    });
    console.log(`   ✓ Created IoT device with ID: ${iotDevice.id}\n`);

    // Test 11: Create IoT location
    console.log('✅ Test 11: Creating IoT location...');
    const iotLocation = await prisma.ioTLocation.create({
      data: {
        deviceId: iotDevice.id,
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 10.5,
        timestamp: new Date(),
        speed: 2.5,
        altitude: 35.0,
      },
    });
    console.log(`   ✓ Created IoT location with ID: ${iotLocation.id}\n`);

    // Test 12: Create notification
    console.log('✅ Test 12: Creating notification...');
    const notification = await prisma.notification.create({
      data: {
        tripId: testTrip.id,
        type: 'reminder',
        title: 'Trip Reminder',
        message: 'Your trip to Paris starts in 7 days!',
        isRead: false,
        scheduledTime: new Date('2025-03-25T09:00:00'),
      },
    });
    console.log(`   ✓ Created notification with ID: ${notification.id}\n`);

    // Test 13: Query data with relations
    console.log('✅ Test 13: Querying data with relations...');
    const tripWithRelations = await prisma.trip.findUnique({
      where: { id: testTrip.id },
      include: {
        user: true,
        days: {
          include: {
            itineraryItems: true,
          },
        },
        budget: true,
        notifications: true,
      },
    });
    console.log(`   ✓ Found trip with ${tripWithRelations?.days.length} days\n`);

    // Test 14: Update data
    console.log('✅ Test 14: Updating data...');
    const updatedTrip = await prisma.trip.update({
      where: { id: testTrip.id },
      data: { status: 'confirmed' },
    });
    console.log(`   ✓ Updated trip status to: ${updatedTrip.status}\n`);

    // Test 15: Delete test data
    console.log('✅ Test 15: Cleaning up test data...');
    await prisma.notification.deleteMany({ where: { tripId: testTrip.id } });
    await prisma.ioTLocation.deleteMany({ where: { deviceId: iotDevice.id } });
    await prisma.ioTDevice.delete({ where: { id: iotDevice.id } });
    await prisma.itineraryItem.deleteMany({ where: { dayId: day1.id } });
    await prisma.day.deleteMany({ where: { tripId: testTrip.id } });
    await prisma.budget.delete({ where: { id: budget.id } });
    await prisma.trip.delete({ where: { id: testTrip.id } });
    await prisma.userPreferences.delete({ where: { id: testPreferences.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.attraction.delete({ where: { id: attraction.id } });
    await prisma.restaurant.delete({ where: { id: restaurant.id } });
    console.log('   ✓ All test data cleaned up\n');

    console.log('🎉 All tests passed! Database connection is working correctly.\n');

  } catch (error) {
    console.error('❌ Database connection test failed!');
    console.error('Error:', error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
