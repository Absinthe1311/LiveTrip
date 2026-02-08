const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/spots/alternatives/cmlcvp5v80000nuggu1a5e3ij?city=%E5%B9%BF%E5%B7%9E',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(data); });
});

req.on('error', (e) => { console.error(e.message); });
req.end();
