// 测试餐厅搜索功能
const { amapService } = require('./dist/services/amapService');

async function test() {
  try {
    console.log('=== 测试餐厅搜索 ===');
    const service = amapService();

    console.log('\n测试1: 搜索海底捞（限制types=050000）');
    const result1 = await service.getAttractions('北京', '海底捞', '050000', 20);
    console.log(`结果数量: ${result1.length}`);
    if (result1.length > 0) {
      console.log('前3个结果:', result1.slice(0, 3).map(r => r.name));
    }

    console.log('\n测试2: 搜索海底捞（不限制types）');
    const result2 = await service.getAttractions('北京', '海底捞', '', 20);
    console.log(`结果数量: ${result2.length}`);
    if (result2.length > 0) {
      console.log('前3个结果:', result2.slice(0, 3).map(r => r.name));
    }

    console.log('\n测试3: 搜索餐厅（通用关键词）');
    const result3 = await service.getAttractions('北京', '餐厅', '050000', 20);
    console.log(`结果数量: ${result3.length}`);
    if (result3.length > 0) {
      console.log('前3个结果:', result3.slice(0, 3).map(r => r.name));
    }

  } catch (error) {
    console.error('错误:', error);
  }
}

test();
