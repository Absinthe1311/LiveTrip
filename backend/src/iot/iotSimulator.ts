// IoT数据模拟服务 - 生成模拟的IoT实时数据
import { IoTData } from '../types';

// 模拟获取IoT数据
export const getSimulatedIoTData = async (attractionId: number): Promise<IoTData> => {
  // 模拟随机数据
  const crowdLevel = Math.floor(Math.random() * 100); // 0-100的拥挤度
  const waitTime = crowdLevel > 70 ? Math.floor(Math.random() * 60) + 30 : 0; // 拥挤度高时才会有等待时间
  
  return {
    id: 0,
    attraction_id: attractionId,
    crowd_level: crowdLevel,
    wait_time_min: waitTime,
    weather: {
      temperature: Math.floor(Math.random() * 15) + 20, // 20-35度
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      rainfall_prob: Math.random() > 0.7 ? '85%' : '10%',
      aqi: Math.floor(Math.random() * 100) + 20, // 20-120
      uv_index: Math.floor(Math.random() * 10) + 1, // 1-10
    },
    is_open: Math.random() > 0.1, // 90%概率开放
    updated_at: new Date()
  };
};

// 模拟获取多个景点的IoT数据
export const getBatchIoTData = async (attractionIds: number[]): Promise<IoTData[]> => {
  return Promise.all(attractionIds.map(id => getSimulatedIoTData(id)));
};
