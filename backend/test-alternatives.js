const axios = require('axios');

async function testAlternativeSpots() {
  try {
    console.log('🧪 测试备选景点功能...\n');

    // 测试1：创建行程（Itinerary页面）
    console.log('📝 测试1：创建行程');
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
    console.log('✅ 行程创建成功');
    
    if (!itinerary || !itinerary.itinerary) {
      console.log('❌ 行程数据格式错误');
      console.log('   响应:', JSON.stringify(createResponse.data, null, 2).substring(0, 500));
      return;
    }
    
    console.log(`   总天数: ${itinerary.itinerary.length}`);
    console.log(`   总费用: ${itinerary.total_cost}元`);

    // 检查alternativePools
    if (itinerary.alternativePools) {
      console.log('\n✅ alternativePools存在');
      const poolKeys = Object.keys(itinerary.alternativePools);
      console.log(`   景点数: ${poolKeys.length}`);

      // 检查第一个景点的备选
      if (poolKeys.length > 0) {
        const firstSpotId = poolKeys[0];
        const alternatives = itinerary.alternativePools[firstSpotId];
        console.log(`\n   第一个景点的备选数: ${alternatives.length}`);

        if (alternatives.length > 0) {
          const firstAlternative = alternatives[0];
          console.log('\n   第一个备选景点数据:');
          console.log(`     名称: ${firstAlternative.name}`);
          console.log(`     图片: ${firstAlternative.image ? '有' : '无'}`);
          console.log(`     IoT数据: ${firstAlternative.iotData ? '有' : '无'}`);
          console.log(`     评分: ${firstAlternative.rating}`);
          console.log(`     费用: ${firstAlternative.estimated_cost}`);
        }
      }
    } else {
      console.log('\n❌ alternativePools不存在');
    }

    // 测试2：获取行程详情（TripDetail页面）
    console.log('\n\n📝 测试2：获取行程详情');
    
    // 先保存行程
    const saveResponse = await axios.post('http://localhost:3001/api/trips', {
      ...itinerary,
      userId: 'test-user-id',
      title: '测试行程',
      coverImage: 'https://example.com/image.jpg'
    });

    const tripId = saveResponse.data.data.id;
    console.log(`✅ 行程保存成功，ID: ${tripId}`);

    // 获取行程详情
    const detailResponse = await axios.get(`http://localhost:3001/api/trips/${tripId}`);
    const tripDetail = detailResponse.data.data;

    console.log('✅ 行程详情获取成功');

    // 检查alternativePools
    if (tripDetail.alternativePools) {
      console.log('\n✅ alternativePools存在');
      const poolKeys = Object.keys(tripDetail.alternativePools);
      console.log(`   景点数: ${poolKeys.length}`);

      // 检查每个景点的备选数
      let totalAlternatives = 0;
      let maxAlternatives = 0;
      for (const spotId of poolKeys) {
        const alternatives = tripDetail.alternativePools[spotId];
        totalAlternatives += alternatives.length;
        maxAlternatives = Math.max(maxAlternatives, alternatives.length);
      }
      console.log(`   总备选数: ${totalAlternatives}`);
      console.log(`   最大备选数: ${maxAlternatives}`);

      if (maxAlternatives > 2) {
        console.log('\n❌ 错误：备选景点数量超过2个');
      } else {
        console.log('\n✅ 备选景点数量正常（≤2个）');
      }

      // 检查第一个景点的备选数据完整性
      if (poolKeys.length > 0) {
        const firstSpotId = poolKeys[0];
        const alternatives = tripDetail.alternativePools[firstSpotId];

        if (alternatives.length > 0) {
          const firstAlternative = alternatives[0];
          console.log('\n   第一个备选景点数据完整性检查:');
          console.log(`     名称: ${firstAlternative.name ? '✅' : '❌'}`);
          console.log(`     图片: ${firstAlternative.image ? '✅' : '❌'}`);
          console.log(`     IoT数据: ${firstAlternative.iotData ? '✅' : '❌'}`);
          console.log(`     评分: ${firstAlternative.rating ? '✅' : '❌'}`);
          console.log(`     费用: ${firstAlternative.estimated_cost !== undefined ? '✅' : '❌'}`);
        }
      }
    } else {
      console.log('\n❌ alternativePools不存在');
    }

    console.log('\n\n✅ 测试完成！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   响应数据:', error.response.data);
    }
  }
}

testAlternativeSpots();
