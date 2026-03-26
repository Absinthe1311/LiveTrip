// Phase 2 功能测试脚本
// 模拟测试 2-opt 路径优化、IoT 检查等功能

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/plan';

async function testPhase2() {
  console.log('🧪 开始 Phase 2 功能测试...\n');

  const testRequest = {
    origin: '北京',
    destination: '上海',
    start_date: '2024-05-01',
    end_date: '2024-05-03',
    budget: 5000,
    days: 3,
    groupSize: 2,
    groupType: 'couple',
    hasChildren: false,
    hasElderly: false,
    preferences: {
      pace: 'moderate',
      energy_level: 'medium',
      categories: ['history', 'art', 'city'],
    },
    attractions: [], // 这个应该从数据库获取
  };

  try {
    console.log('📤 发送测试请求...');
    console.log('请求参数:', JSON.stringify(testRequest, null, 2));

    const response = await axios.post(API_URL, testRequest, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('\n✅ 请求成功！\n');
    console.log('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));

    // 验证响应
    const data = response.data;

    console.log('\n🔍 验证 Phase 2 功能...\n');

    // 1. 检查路径优化
    if (data.total_distance) {
      console.log(`✓ 路径优化生效: 总距离 ${data.total_distance}km`);
    } else {
      console.log('⚠️  未找到总距离信息');
    }

    // 2. 检查备选景点池
    if (data.alternativePools) {
      const poolCount = Object.keys(data.alternativePools).length;
      console.log(`✓ 备选景点池生效: ${poolCount} 个景点有备选方案`);
    } else {
      console.log('⚠️  未找到备选景点池');
    }

    // 3. 检查 IoT 检查结果
    if (data.excludedSpots) {
      console.log(`✓ IoT 检查生效: 排除 ${data.excludedSpots.length} 个景点`);
      if (data.excludedSpots.length > 0) {
        console.log('  被排除的景点:', data.excludedSpots.map(e => e.attraction.name));
      }
    } else {
      console.log('⚠️  未找到 IoT 检查结果');
    }

    if (data.warnings) {
      console.log(`✓ IoT 警告: ${data.warnings.length} 个景点有警告`);
      if (data.warnings.length > 0) {
        console.log('  警告景点:', data.warnings.map(w => `${w.attraction.name} (${w.reason})`));
      }
    } else {
      console.log('⚠️  未找到 IoT 警告信息');
    }

    // 4. 检查预算分配
    if (data.budget_breakdown) {
      console.log('✓ 预算分配:');
      console.log(`  交通: ${data.budget_breakdown.transportation}元`);
      console.log(`  住宿: ${data.budget_breakdown.accommodation}元`);
      console.log(`  餐饮: ${data.budget_breakdown.dining}元`);
      console.log(`  门票: ${data.budget_breakdown.tickets}元`);
      console.log(`  总计: ${data.total_cost}元`);
    }

    console.log('\n✅ Phase 2 测试完成！\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testPhase2();
