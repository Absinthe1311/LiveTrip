/**
 * 地图生成工具
 * 由于高德静态地图API需要单独申请权限,这里使用占位图方案
 */

/**
 * 生成占位地图SVG
 * @param locations 地点数组
 * @param width 图片宽度
 * @param height 图片高度
 * @returns SVG Data URL
 */
export function generateRouteMapUrl(
  locations: string[],
  width: number = 600,
  height: number = 400
): string {
  if (locations.length === 0) {
    console.error('❌ 没有地点数据');
    return '';
  }

  // 生成SVG占位图
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#f0f2f5"/>
      <text x="50%" y="45%" text-anchor="middle" font-size="48" fill="#667eea">🗺️</text>
      <text x="50%" y="60%" text-anchor="middle" font-size="20" fill="#666" font-family="Arial, sans-serif">行程路线图</text>
      <text x="50%" y="70%" text-anchor="middle" font-size="14" fill="#999" font-family="Arial, sans-serif">共 ${locations.length} 个景点</text>
      <text x="50%" y="85%" text-anchor="middle" font-size="12" fill="#bbb" font-family="Arial, sans-serif">请在应用中查看详细地图</text>
    </svg>
  `;

  // 转换为Data URL
  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  console.log('🗺️ 生成占位地图');

  return dataUrl;
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
        // 假设item有latitude和longitude字段
        if (item.latitude && item.longitude) {
          locations.push(`${item.longitude},${item.latitude}`);
        }
      });
    }
  });

  return locations;
}
