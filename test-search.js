const axios = require('axios');

async function test() {
  try {
    const response = await axios.post('http://localhost:3001/api/recommendations/restaurants/custom', {
      name: '海底捞',
      city: '北京'
    });
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
