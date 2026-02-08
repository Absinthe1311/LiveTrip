const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/spots/alternatives/%E5%8C%97%E4%BA%AC%E8%B7%AF%E6%AD%A5%E8%A1%97?city=%E5%B9%BF%E5%B7%9E',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(data.substring(0, 1500)); });
});

req.on('error', (e) => { console.error(e.message); });
req.end();
