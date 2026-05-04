/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */

// 地图控件 - 展示中国地图和用户足迹
import React, { useEffect, useRef, useState, useMemo } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { MapPin, Navigation } from 'lucide-react';
import MapCopyright from '../map/MapCopyright';

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
  const mapInstanceRef = useRef<any>(null); // 保存地图实例
  const markersRef = useRef<any[]>([]); // 保存标记实例
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // 使用useMemo缓存cities的JSON字符串，用于比较
  const citiesKey = useMemo(() => JSON.stringify(cities.map((c) => c.name)), [cities]);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        // 如果地图已经存在，只更新标记
        if (mapInstanceRef.current) {
          console.log('更新地图标记，不重新初始化地图');

          // 清除旧标记
          markersRef.current.forEach((marker) => {
            mapInstanceRef.current.remove(marker);
          });
          markersRef.current = [];

          // 如果没有城市数据，不添加标记
          if (cities.length === 0) {
            return;
          }

          // 添加新标记
          const AMap = (window as any).AMap;
          cities.forEach((city) => {
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

            mapInstanceRef.current.add(marker);
            markersRef.current.push(marker);
          });

          return;
        }

        console.log('首次初始化地图');

        // 加载高德地图
        const AMap = await AMapLoader.load({
          key: import.meta.env.VITE_AMAP_JS_KEY,
          version: '2.0',
          plugins: ['AMap.Scale', 'AMap.Marker', 'AMap.InfoWindow'],
        });

        // 保存AMap到window，供后续使用
        (window as any).AMap = AMap;

        // 创建地图实例
        const map = new AMap.Map(mapRef.current, {
          zoom: 5,
          center: [104.195397, 35.86169], // 中国中心
          mapStyle: 'amap://styles/whitesmoke',
          viewMode: '2D',
          showBuildingBlock: true,
          features: ['bg', 'road', 'building', 'point'],
          showLabel: true,
        });

        // 保存地图实例
        mapInstanceRef.current = map;

        // 添加比例尺
        map.addControl(new AMap.Scale());

        // 注意：高德地图 JS API 2.0 会自动在地图右下角显示审图号
        // 审图号格式：GS(XXXX)XXX号
        // 使用官方地图样式时，审图号由高德自动提供和显示

        // 如果没有城市数据，不添加标记
        if (cities.length === 0) {
          setMapLoaded(true);
          return;
        }

        // 添加城市标记
        cities.forEach((city) => {
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
          markersRef.current.push(marker);
        });

        setMapLoaded(true);
      } catch (error: any) {
        console.error('地图加载失败:', error);
        setMapError('地图加载失败');
      }
    };

    initMap();

    // 清理函数 - 只在组件卸载时清理
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [citiesKey, onCityClick]); // 使用citiesKey而不是cities

  // 降级方案：显示城市列表（仅在地图加载失败时）
  if (mapError) {
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
            {cities.map((city) => (
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
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">我的足迹</h3>
        <span className="text-white/60 text-sm ml-auto">{cities.length} 个城市</span>
      </div>

      {!mapLoaded && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        </div>
      )}

      {/* 地图容器 - 需要position: relative让审图号正确定位 */}
      <div style={{ position: 'relative', flex: 1 }}>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '500px',
            borderRadius: '12px',
            overflow: 'hidden',
            display: mapLoaded ? 'block' : 'none',
          }}
        />
        {/* 高德地图审图号 */}
        {mapLoaded && <MapCopyright position="bottom-right" />}
      </div>
    </div>
  );
};

export default MapWidget;
