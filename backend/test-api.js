// 简单测试API
const axios = require('axios');

async function test() {
  try {
    console.log('测试餐厅搜索API...');
    const response = await axios.post('http://localhost:3001/api/recommendations/restaurants/custom', {
      name: '海底捞',
      city: '北京'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('响应状态:', response.status);
    console.log('Success:', response.data.success);
    console.log('Count:', response.data.count);
    console.log('Data length:', response.data.data ? response.data.data.length : 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('第一个餐厅:', response.data.data[0].name);
    }
  } catch (error) {
    console.error('错误:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

test();
