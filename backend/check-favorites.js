const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/favorites?includeIoT=true',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const response = JSON.parse(data);
    console.log('收藏列表:');
    response.data.forEach((fav, index) => {
      console.log(`${index + 1}. ${fav.spot.name} (${fav.spot.city})`);
      if (fav.spot.iotData) {
        console.log(`   IoT: 人流${fav.spot.iotData.crowdLevel}%, 温度${fav.spot.iotData.temperature}°C, 降雨${fav.spot.iotData.rainProbability}%`);
      }
    });
  });
});

req.on('error', (e) => { console.error('Error:', e.message); });
req.end();
