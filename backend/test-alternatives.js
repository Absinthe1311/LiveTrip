const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/spots/alternatives/北京路步行街?city=广州',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(data.substring(0, 1000)); });
});

req.on('error', (e) => { console.error(e.message); });
req.end();
