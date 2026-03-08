/**
 * 地图截图工具
 * 使用高德Web端JS API生成完整行程地图截图
 */

import AMapLoader from '@amap/amap-jsapi-loader';
import html2canvas from 'html2canvas';

/**
 * 行程数据接口
 */
interface TripData {
  days: DayData[];
  hotel?: {
    name?: string;
    location?: string;
    address?: string;
    type?: string;
  };
}

interface DayData {
  dayNumber: number;
  itineraryItems: ItineraryItemData[];
  restaurantName?: string;
  restaurantLocation?: string;
  restaurantAddress?: string;
}

interface ItineraryItemData {
  name: string;
  longitude?: number;
  latitude?: number;
}

/**
 * 颜色配置
 */
const DAY_COLORS = [
  '#1890ff', // 第1天 - 蓝色
  '#52c41a', // 第2天 - 绿色
  '#fa8c16', // 第3天 - 橙色
  '#722ed1', // 第4天 - 紫色
  '#eb2f96', // 第5天 - 洋红
  '#13c2c2', // 第6天 - 青色
  '#faad14', // 第7天 - 金色
];

const HOTEL_COLOR = '#ff4d4f'; // 酒店 - 红色
const RESTAURANT_COLOR = '#13c2c2'; // 餐厅 - 青色

/**
 * 生成单日地图截图
 * @param dayData 单日行程数据
 * @param hotel 酒店信息
 * @param width 图片宽度
 * @param height 图片高度
 * @returns Promise<string> 返回图片的Data URL
 */
export async function generateDayMapScreenshot(
  dayData: DayData,
  hotel?: {
    name?: string;
    location?: string;
  },
  width: number = 800,
  height: number = 500
): Promise<string> {
  return new Promise((resolve, reject) => {
    const amapKey = import.meta.env.VITE_AMAP_JS_KEY;
    const amapSecret = import.meta.env.VITE_AMAP_JS_SECRET;

    if (!amapKey) {
      reject(new Error('高德地图JS API Key未配置'));
      return;
    }

    // 设置安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: amapSecret,
    };

    // 创建临时容器
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    document.body.appendChild(container);

    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.ToolBar', 'AMap.Scale']
    }).then((AMap) => {
      // 收集所有坐标点
      const allCoords: number[][] = [];

      // 收集景点坐标
      dayData.itineraryItems.forEach(item => {
        if (item.longitude && item.latitude) {
          allCoords.push([item.longitude, item.latitude]);
        }
      });

      // 收集酒店坐标
      if (hotel?.location) {
        const [lng, lat] = hotel.location.split(',').map(Number);
        allCoords.push([lng, lat]);
      }

      // 收集餐厅坐标
      if (dayData.restaurantLocation) {
        const [lng, lat] = dayData.restaurantLocation.split(',').map(Number);
        allCoords.push([lng, lat]);
      }

      if (allCoords.length === 0) {
        document.body.removeChild(container);
        reject(new Error('没有地点数据'));
        return;
      }

      // 计算中心点
      const avgLng = allCoords.reduce((sum, c) => sum + c[0], 0) / allCoords.length;
      const avgLat = allCoords.reduce((sum, c) => sum + c[1], 0) / allCoords.length;

      // 创建地图
      const map = new AMap.Map(container, {
        zoom: 14,
        center: [avgLng, avgLat],
        viewMode: '2D',
        mapStyle: 'amap://styles/normal',
        features: ['bg', 'road', 'building', 'point'],
        showLabel: true,
        showIndoorMap: false,
      });

      // 等待地图加载完成
      map.on('complete', () => {
        // 添加工具栏
        map.addControl(new AMap.ToolBar({
          position: { top: '10px', right: '10px' }
        }));

        // 添加比例尺
        map.addControl(new AMap.Scale());

        // 添加酒店标记
        if (hotel?.location) {
          const [lng, lat] = hotel.location.split(',').map(Number);
          const hotelMarker = new AMap.Marker({
            position: [lng, lat],
            title: hotel.name,
            content: `
              <div style="position: relative; left: 20px;">
                <div style="
                  min-width: 60px;
                  height: 36px;
                  background: linear-gradient(135deg, ${HOTEL_COLOR} 0%, #d4380d 100%);
                  border-radius: 18px;
                  border: 2px solid #fff;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #fff;
                  font-weight: 500;
                  font-size: 11px;
                  padding: 0 10px;
                  white-space: nowrap;
                  opacity: 0.7;
                ">
                  🏨 ${hotel.name || '酒店'}
                </div>
              </div>
            `,
            offset: new AMap.Pixel(-30, -18),
            zIndex: 150
          });
          map.add(hotelMarker);
        }

        const dayColor = DAY_COLORS[(dayData.dayNumber - 1) % DAY_COLORS.length];

        // 添加景点标记
        dayData.itineraryItems.forEach((item, itemIndex) => {
          if (item.longitude && item.latitude) {
            const marker = new AMap.Marker({
              position: [item.longitude, item.latitude],
              title: item.name,
              content: `
                <div style="position: relative;">
                  <div style="
                    min-width: 50px;
                    height: 32px;
                    background: linear-gradient(135deg, ${dayColor} 0%, ${adjustColor(dayColor, -20)} 100%);
                    border-radius: 16px;
                    border: 2px solid #fff;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-weight: 500;
                    font-size: 11px;
                    padding: 0 8px;
                    white-space: nowrap;
                  ">
                    ${item.name}
                  </div>
                </div>
              `,
              offset: new AMap.Pixel(-25, -16),
              zIndex: 100
            });
            map.add(marker);
          }
        });

        // 添加带箭头的路径线
        const pathCoords: number[][] = [];
        dayData.itineraryItems.forEach(item => {
          if (item.longitude && item.latitude) {
            pathCoords.push([item.longitude, item.latitude]);
          }
        });

        if (pathCoords.length > 1) {
          const polyline = new AMap.Polyline({
            path: pathCoords,
            strokeColor: dayColor,
            strokeWeight: 4,
            strokeOpacity: 0.8,
            lineJoin: 'round',
            zIndex: 50,
            showDir: true,
          });
          map.add(polyline);
        }

        // 添加餐厅标记
        if (dayData.restaurantLocation) {
          const [lng, lat] = dayData.restaurantLocation.split(',').map(Number);
          const restaurantMarker = new AMap.Marker({
            position: [lng, lat],
            title: dayData.restaurantName,
            content: `
              <div style="position: relative; left: 20px;">
                <div style="
                  min-width: 60px;
                  height: 36px;
                  background: linear-gradient(135deg, ${RESTAURANT_COLOR} 0%, #08979c 100%);
                  border-radius: 18px;
                  border: 2px solid #fff;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #fff;
                  font-weight: 500;
                  font-size: 11px;
                  padding: 0 10px;
                  white-space: nowrap;
                  opacity: 0.7;
                ">
                  🍽️ ${dayData.restaurantName || '餐厅'}
                </div>
              </div>
            `,
            offset: new AMap.Pixel(-30, -18),
            zIndex: 140
          });
          map.add(restaurantMarker);
        }

        // 自适应显示所有标记
        map.setFitView(null, false, [50, 50, 50, 50]);

        // 等待地图渲染完成
        setTimeout(async () => {
          try {
            console.log(`📸 开始截取第${dayData.dayNumber}天地图...`);

            const canvas = await html2canvas(container, {
              useCORS: true,
              allowTaint: true,
              scale: 2,
              backgroundColor: '#ffffff',
              logging: false,
              width: width,
              height: height,
            });

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            // 清理
            map.destroy();
            document.body.removeChild(container);

            console.log(`🗺️ 第${dayData.dayNumber}天地图截图生成成功`);
            resolve(dataUrl);
          } catch (error) {
            console.error('地图截图失败:', error);
            map.destroy();
            document.body.removeChild(container);
            reject(error);
          }
        }, 2000);
      });

      map.on('error', (error: any) => {
        console.error('地图加载失败:', error);
        document.body.removeChild(container);
        reject(error);
      });
    }).catch((error) => {
      console.error('AMap加载失败:', error);
      document.body.removeChild(container);
      reject(error);
    });
  });
}

/**
 * 生成地图截图
 * @param tripData 完整行程数据
 * @param width 图片宽度
 * @param height 图片高度
 * @returns Promise<string> 返回图片的Data URL
 */
export async function generateMapScreenshot(
  tripData: TripData,
  width: number = 800,
  height: number = 600
): Promise<string> {
  return new Promise((resolve, reject) => {
    const amapKey = import.meta.env.VITE_AMAP_JS_KEY;
    const amapSecret = import.meta.env.VITE_AMAP_JS_SECRET;

    if (!amapKey) {
      reject(new Error('高德地图JS API Key未配置'));
      return;
    }

    // 设置安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: amapSecret,
    };

    // 创建临时容器
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    document.body.appendChild(container);

    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.ToolBar', 'AMap.Scale']
    }).then((AMap) => {
      // 收集所有坐标点
      const allCoords: number[][] = [];

      // 收集景点坐标
      tripData.days.forEach(day => {
        day.itineraryItems.forEach(item => {
          if (item.longitude && item.latitude) {
            allCoords.push([item.longitude, item.latitude]);
          }
        });
      });

      // 收集酒店坐标
      if (tripData.hotel?.location) {
        const [lng, lat] = tripData.hotel.location.split(',').map(Number);
        allCoords.push([lng, lat]);
      }

      // 收集餐厅坐标
      tripData.days.forEach(day => {
        if (day.restaurantLocation) {
          const [lng, lat] = day.restaurantLocation.split(',').map(Number);
          allCoords.push([lng, lat]);
        }
      });

      if (allCoords.length === 0) {
        document.body.removeChild(container);
        reject(new Error('没有地点数据'));
        return;
      }

      // 计算中心点
      const avgLng = allCoords.reduce((sum, c) => sum + c[0], 0) / allCoords.length;
      const avgLat = allCoords.reduce((sum, c) => sum + c[1], 0) / allCoords.length;

      // 创建地图
      const map = new AMap.Map(container, {
        zoom: 13, // 提高默认缩放级别
        center: [avgLng, avgLat],
        viewMode: '2D',
        mapStyle: 'amap://styles/normal',
        features: ['bg', 'road', 'building', 'point'], // 显示背景、道路、建筑、兴趣点
        showLabel: true, // 显示文字标注
        showIndoorMap: false,
      });

      // 等待地图加载完成
      map.on('complete', () => {
        // 添加工具栏
        map.addControl(new AMap.ToolBar({
          position: { top: '10px', right: '10px' }
        }));

        // 添加比例尺
        map.addControl(new AMap.Scale());

        // 添加酒店标记
        if (tripData.hotel?.location) {
          const [lng, lat] = tripData.hotel.location.split(',').map(Number);
          const hotelMarker = new AMap.Marker({
            position: [lng, lat],
            title: tripData.hotel.name,
            content: `
              <div style="position: relative;">
                <div style="
                  min-width: 60px;
                  height: 36px;
                  background: linear-gradient(135deg, ${HOTEL_COLOR} 0%, #d4380d 100%);
                  border-radius: 18px;
                  border: 2px solid #fff;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #fff;
                  font-weight: 500;
                  font-size: 11px;
                  padding: 0 10px;
                  white-space: nowrap;
                ">
                  🏨 ${tripData.hotel.name || '酒店'}
                </div>
              </div>
            `,
            offset: new AMap.Pixel(-30, -18),
            zIndex: 150
          });
          map.add(hotelMarker);
        }

        // 添加每天的景点和餐厅
        tripData.days.forEach((day, dayIndex) => {
          const dayColor = DAY_COLORS[dayIndex % DAY_COLORS.length];

          // 添加景点标记
          day.itineraryItems.forEach((item, itemIndex) => {
            if (item.longitude && item.latitude) {
              const marker = new AMap.Marker({
                position: [item.longitude, item.latitude],
                title: item.name,
                content: `
                  <div style="position: relative;">
                    <div style="
                      min-width: 50px;
                      height: 32px;
                      background: linear-gradient(135deg, ${dayColor} 0%, ${adjustColor(dayColor, -20)} 100%);
                      border-radius: 16px;
                      border: 2px solid #fff;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: #fff;
                      font-weight: 500;
                      font-size: 11px;
                      padding: 0 8px;
                      white-space: nowrap;
                    ">
                      ${item.name}
                    </div>
                  </div>
                `,
                offset: new AMap.Pixel(-25, -16),
                zIndex: 100
              });
              map.add(marker);
            }
          });

          // 添加带箭头的路径线
          const pathCoords: number[][] = [];
          day.itineraryItems.forEach(item => {
            if (item.longitude && item.latitude) {
              pathCoords.push([item.longitude, item.latitude]);
            }
          });

          if (pathCoords.length > 1) {
            // 使用Polyline绘制路径
            const polyline = new AMap.Polyline({
              path: pathCoords,
              strokeColor: dayColor,
              strokeWeight: 4,
              strokeOpacity: 0.8,
              lineJoin: 'round',
              zIndex: 50,
              showDir: true, // 显示方向箭头
            });
            map.add(polyline);
          }

          // 添加餐厅标记
          if (day.restaurantLocation) {
            const [lng, lat] = day.restaurantLocation.split(',').map(Number);
            const restaurantMarker = new AMap.Marker({
              position: [lng, lat],
              title: day.restaurantName,
              content: `
                <div style="position: relative;">
                  <div style="
                    min-width: 60px;
                    height: 36px;
                    background: linear-gradient(135deg, ${RESTAURANT_COLOR} 0%, #08979c 100%);
                    border-radius: 18px;
                    border: 2px solid #fff;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-weight: 500;
                    font-size: 11px;
                    padding: 0 10px;
                    white-space: nowrap;
                  ">
                    🍽️ ${day.restaurantName || '餐厅'}
                  </div>
                </div>
              `,
              offset: new AMap.Pixel(-30, -18),
              zIndex: 140
            });
            map.add(restaurantMarker);
          }
        });

        // 添加图例
        const legendHtml = createLegend(tripData.days.length);
        const legendMarker = new AMap.Marker({
          position: map.getBounds().getNorthEast(),
          content: legendHtml,
          offset: new AMap.Pixel(-150, 10),
          zIndex: 200
        });
        map.add(legendMarker);

        // 自适应显示所有标记,并设置合适的缩放级别
        map.setFitView(null, false, [50, 50, 50, 50]);

        // 等待地图渲染完成
        setTimeout(async () => {
          try {
            console.log('📸 开始截取地图...');

            // 使用html2canvas截取整个容器(包括地图和标记)
            const canvas = await html2canvas(container, {
              useCORS: true,
              allowTaint: true,
              scale: 2,
              backgroundColor: '#ffffff',
              logging: false,
              width: width,
              height: height,
            });

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            // 清理
            map.destroy();
            document.body.removeChild(container);

            console.log('🗺️ 地图截图生成成功');
            resolve(dataUrl);
          } catch (error) {
            console.error('地图截图失败:', error);
            map.destroy();
            document.body.removeChild(container);
            reject(error);
          }
        }, 2000); // 增加等待时间确保地图完全渲染
      });

      map.on('error', (error: any) => {
        console.error('地图加载失败:', error);
        document.body.removeChild(container);
        reject(error);
      });
    }).catch((error) => {
      console.error('AMap加载失败:', error);
      document.body.removeChild(container);
      reject(error);
    });
  });
}

/**
 * 创建图例HTML
 */
function createLegend(dayCount: number): string {
  let legendItems = '';

  // 添加每天的图例
  for (let i = 0; i < dayCount; i++) {
    const color = DAY_COLORS[i % DAY_COLORS.length];
    legendItems += `
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <div style="width: 16px; height: 16px; background: ${color}; border-radius: 50%; margin-right: 6px;"></div>
        <span style="font-size: 12px; color: #333;">第${i + 1}天</span>
      </div>
    `;
  }

  // 添加酒店图例
  legendItems += `
    <div style="display: flex; align-items: center; margin-bottom: 4px;">
      <div style="width: 16px; height: 16px; background: ${HOTEL_COLOR}; border-radius: 50%; margin-right: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px;">🏨</div>
      <span style="font-size: 12px; color: #333;">酒店</span>
    </div>
  `;

  // 添加餐厅图例
  legendItems += `
    <div style="display: flex; align-items: center;">
      <div style="width: 16px; height: 16px; background: ${RESTAURANT_COLOR}; border-radius: 50%; margin-right: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px;">🍽️</div>
      <span style="font-size: 12px; color: #333;">餐厅</span>
    </div>
  `;

  return `
    <div style="
      background: rgba(255, 255, 255, 0.95);
      padding: 10px 12px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-family: Arial, sans-serif;
      min-width: 80px;
    ">
      <div style="font-size: 13px; font-weight: bold; color: #333; margin-bottom: 8px;">图例</div>
      ${legendItems}
    </div>
  `;
}

/**
 * 调整颜色亮度
 */
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);

  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * 从行程数据中提取所有地点坐标
 * @param days 每日行程数据
 * @returns 地点坐标数组
 */
export function extractLocationsFromDays(days: any[]): string[] {
  const locations: string[] = [];

  days.forEach(day => {
    if (day.itineraryItems) {
      day.itineraryItems.forEach((item: any) => {
        if (item.latitude && item.longitude) {
          locations.push(`${item.longitude},${item.latitude}`);
        }
      });
    }
  });

  return locations;
}
