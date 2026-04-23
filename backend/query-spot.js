const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 从命令行参数获取查询条件
const queryType = process.argv[2] || 'help';
const param1 = process.argv[3];
const param2 = process.argv[4];

async function querySpots() {
  try {
    switch (queryType) {
      case 'city':
        // 按城市查询景点
        if (!param1) {
          console.log('❌ 请提供城市名称，例如: node query-spot.js city 上海');
          return;
        }
        console.log(`\n📍 查询城市: ${param1}\n`);
        const citySpots = await prisma.spot.findMany({
          where: { city: param1 },
          include: { image: true },
          take: 20
        });
        console.table(
          citySpots.map(s => ({
            名称: s.name.substring(0, 20),
            有图片: s.image ? '✅' : '❌',
            分类: s.category || '未分类',
            评分: s.rating || '无'
          }))
        );
        console.log(`\n共找到 ${citySpots.length} 个景点`);
        break;

      case 'name':
        // 按名称搜索景点
        if (!param1) {
          console.log('❌ 请提供景点名称，例如: node query-spot.js name 外滩');
          return;
        }
        console.log(`\n🔍 搜索景点: ${param1}\n`);
        const namedSpots = await prisma.spot.findMany({
          where: {
            name: { contains: param1 }
          },
          include: { image: true }
        });
        console.table(
          namedSpots.map(s => ({
            ID: s.id.substring(0, 8),
            名称: s.name,
            城市: s.city,
            有图片: s.image ? '✅' : '❌',
            图片URL: s.image ? s.image.url.substring(0, 40) + '...' : '无'
          }))
        );
        console.log(`\n共找到 ${namedSpots.length} 个匹配的景点`);
        break;

      case 'no-image':
        // 查询没有图片的景点
        console.log(`\n❌ 查询没有图片的景点\n`);
        const noImageSpots = await prisma.spot.findMany({
          where: { image: null },
          take: 20
        });
        console.table(
          noImageSpots.map(s => ({
            名称: s.name.substring(0, 20),
            城市: s.city,
            分类: s.category || '未分类'
          }))
        );
        const totalNoImage = await prisma.spot.count({
          where: { image: null }
        });
        console.log(`\n共 ${totalNoImage} 个景点没有图片`);
        break;

      case 'with-image':
        // 查询有图片的景点
        console.log(`\n✅ 查询有图片的景点\n`);
        const withImageSpots = await prisma.spot.findMany({
          where: { image: { is: {} } },
          include: { image: true },
          take: 20
        });
        console.table(
          withImageSpots.map(s => ({
            名称: s.name.substring(0, 20),
            城市: s.city,
            图片来源: s.image.source,
            图片URL: s.image.url.substring(0, 40) + '...'
          }))
        );
        const totalWithImage = await prisma.spot.count({
          where: { image: { is: {} } }
        });
        console.log(`\n共 ${totalWithImage} 个景点有图片`);
        break;

      case 'detail':
        // 查看景点详情
        if (!param1) {
          console.log('❌ 请提供景点ID，例如: node query-spot.js detail cmn5k03fy');
          return;
        }
        const spotDetail = await prisma.spot.findFirst({
          where: {
            OR: [
              { id: { startsWith: param1 } },
              { name: { contains: param1 } }
            ]
          },
          include: {
            image: true,
            reviews: { take: 5 },
            favorites: { take: 5 }
          }
        });
        if (!spotDetail) {
          console.log('❌ 未找到景点');
          return;
        }
        console.log('\n========== 景点详情 ==========\n');
        console.log('基本信息:');
        console.log(`  ID: ${spotDetail.id}`);
        console.log(`  名称: ${spotDetail.name}`);
        console.log(`  城市: ${spotDetail.city}`);
        console.log(`  地址: ${spotDetail.address || '无'}`);
        console.log(`  分类: ${spotDetail.category || '无'}`);
        console.log(`  评分: ${spotDetail.rating || '无'}`);
        console.log(`  门票: ${spotDetail.ticketPrice || '无'} 元`);
        console.log(`  描述: ${(spotDetail.description || '无').substring(0, 100)}...`);
        console.log(`\n图片信息:`);
        if (spotDetail.image) {
          console.log(`  ✅ 有图片`);
          console.log(`  URL: ${spotDetail.image.url}`);
          console.log(`  来源: ${spotDetail.image.source}`);
          console.log(`  上传者: ${spotDetail.image.uploadedBy}`);
        } else {
          console.log(`  ❌ 无图片`);
        }
        console.log(`\n统计:`);
        console.log(`  收藏数: ${spotDetail.favorites.length}`);
        console.log(`  评价数: ${spotDetail.reviews.length}`);
        break;

      case 'help':
      default:
        console.log(`
========================================
  景点查询工具 - 使用说明
========================================

用法: node query-spot.js <命令> [参数]

命令列表:
  city <城市名>        按城市查询景点
                       示例: node query-spot.js city 上海

  name <景点名>        按名称搜索景点
                       示例: node query-spot.js name 外滩

  no-image            查询没有图片的景点
                       示例: node query-spot.js no-image

  with-image          查询有图片的景点
                       示例: node query-spot.js with-image

  detail <ID或名称>    查看景点详情
                       示例: node query-spot.js detail 外滩

  help                显示此帮助信息
                       示例: node query-spot.js help

========================================
        `);
        break;
    }
  } catch (error) {
    console.error('❌ 查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

querySpots();
