import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HOT_CITIES = ['北京', '北京市', '上海', '上海市', '广州', '广州市', '深圳', '深圳市', '成都', '成都市', '厦门', '厦门市'];

async function main() {
  const spots = await prisma.spot.findMany({
    where: {
      city: {
        in: HOT_CITIES,
      },
    },
    select: {
      id: true,
      name: true,
      category: true,
      city: true,
      description: true,
    },
    orderBy: {
      rating: 'desc',
    },
    take: 100,
  });

  console.log(`找到 ${spots.length} 个热门景点`);
  console.log(JSON.stringify(spots, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
