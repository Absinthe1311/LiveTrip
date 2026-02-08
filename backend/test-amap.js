const axios = require('axios');

async function testAmapSearch() {
  const amapKey = process.env.AMAP_API_KEY;
  
  const response = await axios.get(
    `https://restapi.amap.com/v3/place/text`,
    {
      params: {
        key: amapKey,
        keywords: '新余',
        citylimit: false,
        children: 1,
        offset: 20,
        page: 1,
        extensions: 'base',
      },
    }
  );

  console.log('高德API响应:');
  console.log('状态:', response.data.status);
  console.log('信息:', response.data.info);
  console.log('结果数量:', response.data.pois?.length);
  
  if (response.data.pois && response.data.pois.length > 0) {
    console.log('\n前5个结果:');
    response.data.pois.slice(0, 5).forEach((poi, index) => {
      console.log(`${index + 1}. ${poi.name} (${poi.cityname || poi.adname})`);
    });
  }
}

testAmapSearch().catch(console.error);
