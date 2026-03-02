const http = require('http');

// 测试添加收藏
const addFavorite = () => {
  const data = JSON.stringify({
    spotId: 'cmlcvp5v80000nuggu1a5e3ij', // 北京路步行街
    notes: '测试收藏'
  });

  const options = {
    hostname: 'localhost',
    port: 3003,
    path: '/api/favorites',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => { responseData += chunk; });
    res.on('end', () => {
      console.log('添加收藏响应:', responseData);
      getFavorites();
    });
  });

  req.on('error', (e) => { console.error('添加收藏错误:', e.message); });
  req.write(data);
  req.end();
};

// 测试获取收藏列表
const getFavorites = () => {
  const options = {
    hostname: 'localhost',
    port: 3003,
    path: '/api/favorites?includeIoT=true',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => { responseData += chunk; });
    res.on('end', () => {
      console.log('\n获取收藏列表响应:');
      console.log(responseData);
    });
  });

  req.on('error', (e) => { console.error('获取收藏列表错误:', e.message); });
  req.end();
};

addFavorite();
