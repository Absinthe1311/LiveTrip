import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.spot.count({
    where: {
      description: {
        not: null,
      },
    },
  });

  const total = await prisma.spot.count();

  const withLongDesc = await prisma.spot.count({
    where: {
      description: {
        not: null,
      },
      AND: [
        {
          description: {
            gte: '', // 长度大于等于80
          },
        },
      ],
    },
  });

  console.log(`总景点数: ${total}`);
  console.log(`有描述的景点: ${count}`);
  console.log(`描述长度>=80的景点: ${withLongDesc}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
