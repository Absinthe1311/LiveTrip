// 测试脚本：验证餐厅过滤逻辑
// 运行方式：node test-optimization.js

const testRestaurants = [
  { name: '全聚德烤鸭店', type: '中餐厅;京菜', address: '北京市东城区前门大街' },
  { name: '麦当劳', type: '快餐;西式快餐', address: '北京市朝阳区' },
  { name: '海底捞火锅', type: '中餐厅;火锅', address: '北京市海淀区' },
  { name: '星巴克咖啡', type: '咖啡厅;西式', address: '北京市朝阳区' },
  { name: '清华大学食堂', type: '学校;食堂', address: '北京市海淀区清华大学' },
  { name: '西贝莜面村', type: '中餐厅;西北菜', address: '北京市朝阳区' },
  { name: '7-11便利店', type: '便利店', address: '北京市朝阳区' },
  { name: '大董烤鸭店', type: '中餐厅;京菜', address: '北京市朝阳区' },
  { name: '必胜客', type: '西餐厅;披萨', address: '北京市朝阳区' },
  { name: '学校餐厅', type: '学校;餐厅', address: '某学校内' }
];

// 不合适的餐厅类型关键词
const excludedKeywords = [
  '快餐', '小吃店', '学校', '食堂', '外卖', '便利店',
  '咖啡厅', '咖啡店', '奶茶', '甜品', '酒吧', '夜总会',
  'KTV', '网吧', '棋牌', '足浴', '按摩', 'SPA',
  '美容', '美发', '理发', '洗衣', '照相', '复印',
  '快递', '物流', '停车场', '加油站', '汽修', '洗车',
  '药店', '医院', '诊所', '宠物', '花店', '水果',
  '超市', '商场', '市场', '摊位', '大排档', '路边摊'
];

function filterInappropriateRestaurants(restaurants) {
  return restaurants.filter(restaurant => {
    const nameAndType = `${restaurant.name} ${restaurant.type} ${restaurant.address}`;

    for (const keyword of excludedKeywords) {
      if (nameAndType.includes(keyword)) {
        console.log(`🚫 过滤: ${restaurant.name} (包含: ${keyword})`);
        return false;
      }
    }

    return true;
  });
}

console.log('='.repeat(60));
console.log('餐厅过滤测试');
console.log('='.repeat(60));
console.log(`\n原始餐厅数量: ${testRestaurants.length}`);
console.log('\n原始餐厅列表:');
testRestaurants.forEach((r, i) => {
  console.log(`  ${i+1}. ${r.name} - ${r.type}`);
});

console.log('\n' + '='.repeat(60));
console.log('开始过滤...');
console.log('='.repeat(60));

const filteredRestaurants = filterInappropriateRestaurants(testRestaurants);

console.log('\n' + '='.repeat(60));
console.log('过滤结果');
console.log('='.repeat(60));
console.log(`\n过滤后餐厅数量: ${filteredRestaurants.length}`);
console.log('\n保留的餐厅:');
filteredRestaurants.forEach((r, i) => {
  console.log(`  ${i+1}. ${r.name} - ${r.type}`);
});

console.log('\n' + '='.repeat(60));
console.log('统计');
console.log('='.repeat(60));
console.log(`原始数量: ${testRestaurants.length}`);
console.log(`过滤后数量: ${filteredRestaurants.length}`);
console.log(`过滤掉数量: ${testRestaurants.length - filteredRestaurants.length}`);
console.log(`过滤率: ${((testRestaurants.length - filteredRestaurants.length) / testRestaurants.length * 100).toFixed(1)}%`);
console.log(`保留率: ${(filteredRestaurants.length / testRestaurants.length * 100).toFixed(1)}%`);

console.log('\n✅ 测试完成！');
