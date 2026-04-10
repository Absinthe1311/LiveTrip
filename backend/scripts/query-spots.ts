import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const spots = await prisma.spot.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      city: true,
      description: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(JSON.stringify(spots, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
