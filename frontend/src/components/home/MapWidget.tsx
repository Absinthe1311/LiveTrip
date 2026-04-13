// 地图控件 - 展示中国地图和用户足迹
import React, { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { MapPin, Navigation } from 'lucide-react';

interface FootprintCity {
  name: string;
  location: string;
  tripCount: number;
  tripIds: string[];
}

interface MapWidgetProps {
  cities: FootprintCity[];
  onCityClick?: (city: FootprintCity) => void;
}

const MapWidget: React.FC<MapWidgetProps> = ({ cities, onCityClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || cities.length === 0) return;

    const initMap = async () => {
      try {
        // 加载高德地图
        const AMap = await AMapLoader.load({
          key: import.meta.env.VITE_AMAP_JS_KEY,
          version: '2.0',
          plugins: ['AMap.Scale', 'AMap.Marker', 'AMap.InfoWindow'],
        });

        // 创建地图实例
        const map = new AMap.Map(mapRef.current, {
          zoom: 5,
          center: [104.195397, 35.86169], // 中国中心
          mapStyle: 'amap://styles/whitesmoke',
          viewMode: '2D',
        });

        // 添加比例尺
        map.addControl(new AMap.Scale());

        // 添加城市标记
        cities.forEach(city => {
          if (!city.location) return;

          const [lng, lat] = city.location.split(',').map(Number);
          if (isNaN(lng) || isNaN(lat)) return;

          // 创建自定义标记内容
          const markerContent = document.createElement('div');
          markerContent.className = 'custom-marker';
          markerContent.innerHTML = `
            <div style="
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: white;
              padding: 6px 12px;
              border-radius: 16px;
              font-size: 13px;
              font-weight: 600;
              box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
              white-space: nowrap;
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              ${city.name} (${city.tripCount})
            </div>
          `;

          // 创建标记
          const marker = new AMap.Marker({
            position: [lng, lat],
            content: markerContent,
            offset: new AMap.Pixel(-20, -20),
          });

          // 添加点击事件
          marker.on('click', () => {
            if (onCityClick) {
              onCityClick(city);
            }
          });

          // 添加悬停效果
          markerContent.addEventListener('mouseenter', () => {
            const child = markerContent.firstElementChild as HTMLElement;
            if (child) {
              child.style.transform = 'scale(1.1)';
              child.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.6)';
            }
          });

          markerContent.addEventListener('mouseleave', () => {
            const child = markerContent.firstElementChild as HTMLElement;
            if (child) {
              child.style.transform = 'scale(1)';
              child.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.4)';
            }
          });

          map.add(marker);
        });

        setMapLoaded(true);
      } catch (error: any) {
        console.error('地图加载失败:', error);
        setMapError('地图加载失败');
      }
    };

    initMap();

    // 清理函数
    return () => {
      // 高德地图的清理逻辑
    };
  }, [cities, onCityClick]);

  // 降级方案：显示城市列表
  if (mapError || cities.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">我的足迹</h3>
        </div>

        {cities.length === 0 ? (
          <div className="text-center py-8">
            <Navigation className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <p className="text-white/60">开始您的第一次旅行吧</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cities.map(city => (
              <div
                key={city.name}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => onCityClick?.(city)}
              >
                <span className="text-white">{city.name}</span>
                <span className="text-amber-400 text-sm">去过 {city.tripCount} 次</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">我的足迹</h3>
        <span className="text-white/60 text-sm ml-auto">
          {cities.length} 个城市
        </span>
      </div>

      {!mapLoaded && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        </div>
      )}

      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '12px',
          overflow: 'hidden',
          display: mapLoaded ? 'block' : 'none',
        }}
      />
    </div>
  );
};

export default MapWidget;
