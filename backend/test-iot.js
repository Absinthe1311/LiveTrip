const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/iot/data',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('IoT Data Response:');
    console.log(data.substring(0, 500)); // 只打印前500个字符
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
