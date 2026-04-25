const axios = require('axios');

async function testAlternativeSpotImages() {
  try {
    console.log('🧪 测试备选景点图片...\n');

    // 创建行程
    console.log('📝 创建行程...');
    const createResponse = await axios.post('http://localhost:3001/api/plan', {
      destination: '北京',
      start_date: '2026-04-25',
      end_date: '2026-04-27',
      days: 3,
      budget: 3000,
      group_size: 2,
      group_type: 'couple',
      preferences: {
        categories: ['历史文化', '自然风光'],
        pace: 'moderate'
      }
    });

    const itinerary = createResponse.data.data;
    console.log('✅ 行程创建成功\n');

    // 检查alternativePools
    if (itinerary.alternativePools) {
      console.log('✅ alternativePools存在');
      const poolKeys = Object.keys(itinerary.alternativePools);
      console.log(`   景点数: ${poolKeys.length}\n`);

      // 检查每个景点的备选
      let totalWithImage = 0;
      let totalWithoutImage = 0;
      
      for (const spotId of poolKeys) {
        const alternatives = itinerary.alternativePools[spotId];
        
        for (const alt of alternatives) {
          if (alt.image) {
            totalWithImage++;
            console.log(`✅ ${alt.name}: 有图片`);
            console.log(`   图片URL: ${alt.image.substring(0, 60)}...`);
          } else {
            totalWithoutImage++;
            console.log(`❌ ${alt.name}: 无图片`);
          }
        }
      }

      console.log(`\n📊 统计：`);
      console.log(`   有图片的备选景点: ${totalWithImage}`);
      console.log(`   无图片的备选景点: ${totalWithoutImage}`);
      console.log(`   图片覆盖率: ${((totalWithImage / (totalWithImage + totalWithoutImage)) * 100).toFixed(1)}%`);

    } else {
      console.log('❌ alternativePools不存在');
    }

    console.log('\n✅ 测试完成！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   响应数据:', error.response.data);
    }
  }
}

testAlternativeSpotImages();
