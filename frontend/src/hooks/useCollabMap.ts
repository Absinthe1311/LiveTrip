/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：Hook重构
 */

// 协同规划地图Hook - 封装高德地图操作
import { useEffect, useRef, useState, useCallback } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

// 高德地图类型定义
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

export interface Spot {
  id: string;
  name: string;
  location: string; // "lng,lat"
  category?: string;
}

export interface RoutePoint {
  spotId: string;
  lng: number;
  lat: number;
  order: number;
}

interface UseCollabMapOptions {
  containerId: string;
  onSpotClick?: (spot: Spot) => void;
  onMapClick?: (lng: number, lat: number) => void;
  isLocked?: boolean;
  enabled?: boolean;
}

interface UseCollabMapReturn {
  map: any;
  addSpotMarker: (spot: Spot, color?: string) => void;
  updateSpotMarkerStyle: (spotId: string, style: 'normal' | 'candidate' | 'selected') => void;
  removeSpotMarker: (spotId: string) => void;
  clearAllMarkers: () => void;
  drawRoute: (points: RoutePoint[], color?: string) => void;
  clearRoute: () => void;
  setMapCenter: (lng: number, lat: number) => void;
  setMapZoom: (zoom: number) => void;
  setCityWithBoundary: (cityName: string) => void;
  showSpotStats: (stats: Map<string, number>) => void;
  hideSpotStats: () => void;
  highlightSpots: (spotIds: string[], hotSpotIds: string[]) => void;
  isLoaded: boolean;
}

export function useCollabMap(options: UseCollabMapOptions): UseCollabMapReturn {
  const { containerId, onSpotClick, onMapClick, isLocked = false, enabled = true } = options;

  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polylinesRef = useRef<any[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);

  const amapKey = import.meta.env.VITE_AMAP_JS_KEY;
  const amapSecret = import.meta.env.VITE_AMAP_JS_SECRET;

  // 初始化地图
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!amapKey) {
      console.error('缺少高德地图API Key');
      return;
    }

    // 延迟初始化，确保DOM已渲染
    const initTimer = setTimeout(() => {
      // 设置安全密钥
      window._AMapSecurityConfig = {
        securityJsCode: amapSecret,
      };

      AMapLoader.load({
        key: amapKey,
        version: '2.0',
        plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.Marker', 'AMap.Polyline'],
      })
        .then((AMap) => {
          const container = document.getElementById(containerId);
          if (!container) {
            console.error('找不到地图容器:', containerId);
            return;
          }

          // 创建地图实例
          const map = new AMap.Map(container, {
            zoom: 12,
            center: [116.397428, 39.90923], // 默认北京
            viewMode: '2D',
            mapStyle: 'amap://styles/dark', // 使用暗色主题
            features: ['bg', 'road', 'building', 'point'],
            showLabel: true,
            showBuildingBlock: true,
          });

          // 注意：高德地图 JS API 2.0 会自动在地图右下角显示审图号
          // 审图号格式：GS(XXXX)XXX号
          // 使用官方地图样式时，审图号由高德自动提供和显示

          // 添加控件
          map.addControl(
            new AMap.ToolBar({
              position: 'RB',
            })
          );
          map.addControl(new AMap.Scale());

          // 地图点击事件
          if (onMapClick) {
            map.on('click', (e: any) => {
              onMapClick(e.lnglat.getLng(), e.lnglat.getLat());
            });
          }

          mapRef.current = map;
          setIsLoaded(true);

          console.log('✅ 协同规划地图初始化成功');
        })
        .catch((error) => {
          console.error('❌ 地图初始化失败:', error);
        });
    }, 100); // 延迟100ms初始化

    return () => {
      clearTimeout(initTimer);
      // 清理地图
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      setIsLoaded(false);
    };
  }, [containerId, amapKey, amapSecret, onMapClick, enabled]);

  // 添加景点标记
  const addSpotMarker = useCallback(
    (spot: Spot, color: string = '#3B82F6') => {
      if (!mapRef.current || !window.AMap) return;

      const [lng, lat] = spot.location.split(',').map(Number);

      // 锁定后禁用点击，cursor改为default
      const cursorStyle = isLocked ? 'default' : 'pointer';

      // 创建自定义标记 - 显示完整景点名称
      const markerContent = `
      <div style="
        background: ${color};
        padding: 6px 12px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        cursor: ${cursorStyle};
        white-space: nowrap;
        border: 2px solid rgba(255,255,255,0.3);
        transition: all 0.2s;
      ">
        ${spot.name}
      </div>
    `;

      const marker = new window.AMap.Marker({
        position: [lng, lat],
        content: markerContent,
        offset: new window.AMap.Pixel(-20, -20),
        extData: spot,
      });

      // 锁定后禁用点击事件
      if (!isLocked && onSpotClick) {
        marker.on('click', () => {
          onSpotClick(spot);
        });
      }

      // 锁定后禁用悬停效果
      if (!isLocked) {
        marker.on('mouseover', () => {
          marker.setContent(`
          <div style="
            background: ${color};
            padding: 8px 16px;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.5);
            cursor: pointer;
            white-space: nowrap;
            border: 2px solid rgba(255,255,255,0.5);
            transform: scale(1.1);
          ">
            ${spot.name}
          </div>
        `);
        });

        marker.on('mouseout', () => {
          marker.setContent(markerContent);
        });
      }

      marker.setMap(mapRef.current);
      markersRef.current.set(spot.id, marker);
    },
    [onSpotClick, isLocked]
  );

  // 移除景点标记
  const removeSpotMarker = useCallback((spotId: string) => {
    const marker = markersRef.current.get(spotId);
    if (marker) {
      marker.setMap(null);
      markersRef.current.delete(spotId);
    }
  }, []);

  // 更新景点标记样式
  const updateSpotMarkerStyle = useCallback(
    (spotId: string, style: 'normal' | 'candidate' | 'selected') => {
      const marker = markersRef.current.get(spotId);
      if (!marker) return;

      const spot = marker.getExtData();
      if (!spot) return;

      let color = '#3B82F6'; // 默认蓝色
      let borderColor = 'rgba(255,255,255,0.3)';
      let scale = 1;

      switch (style) {
        case 'candidate':
          color = '#10B981'; // 绿色 - 待选景点
          borderColor = 'rgba(16,185,129,0.5)';
          scale = 1.1;
          break;
        case 'selected':
          color = '#EF4444'; // 红色 - 已选景点
          borderColor = 'rgba(239,68,68,0.5)';
          scale = 1.2;
          break;
        default:
          color = '#3B82F6'; // 蓝色 - 普通
          borderColor = 'rgba(255,255,255,0.3)';
          scale = 1;
      }

      const markerContent = `
      <div style="
        background: ${color};
        padding: ${6 * scale}px ${12 * scale}px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: ${13 * scale}px;
        box-shadow: 0 ${4 * scale}px ${12 * scale}px rgba(0,0,0,0.4);
        cursor: pointer;
        white-space: nowrap;
        border: 2px solid ${borderColor};
        transition: all 0.2s;
      ">
        ${spot.name}
      </div>
    `;

      marker.setContent(markerContent);
    },
    []
  );

  // 清除所有标记
  const clearAllMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current.clear();
  }, []);

  // 绘制路线
  const drawRoute = useCallback((points: RoutePoint[], color: string = '#3B82F6') => {
    if (!mapRef.current || !window.AMap || points.length < 2) return;

    // 按顺序排序
    const sortedPoints = [...points].sort((a, b) => a.order - b.order);

    // 创建路径
    const path = sortedPoints.map((point) => [point.lng, point.lat]);

    const polyline = new window.AMap.Polyline({
      path: path,
      strokeColor: color,
      strokeWeight: 6, // 增加线条粗细
      strokeOpacity: 1.0, // 完全不透明
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true, // 显示方向箭头
      borderWeight: 2, // 添加边框
      borderColor: 'rgba(255,255,255,0.3)', // 白色边框
    });

    polyline.setMap(mapRef.current);
    polylinesRef.current.push(polyline);
  }, []);

  // 清除路线
  const clearRoute = useCallback(() => {
    polylinesRef.current.forEach((polyline) => {
      polyline.setMap(null);
    });
    polylinesRef.current = [];
  }, []);

  // 设置地图中心
  const setMapCenter = useCallback((lng: number, lat: number) => {
    if (mapRef.current) {
      mapRef.current.setCenter([lng, lat]);
    }
  }, []);

  // 设置地图缩放
  const setMapZoom = useCallback((zoom: number) => {
    if (mapRef.current) {
      mapRef.current.setZoom(zoom);
    }
  }, []);

  // 定位到城市并显示边界
  const setCityWithBoundary = useCallback((cityName: string) => {
    if (!mapRef.current || !window.AMap) return;

    const map = mapRef.current;
    const AMap = window.AMap;

    // 使用地理编码服务定位城市
    AMap.plugin('AMap.Geocoder', () => {
      const geocoder = new AMap.Geocoder({
        city: cityName,
      });

      geocoder.getLocation(cityName, (status: string, result: any) => {
        if (status === 'complete' && result.geocodes.length > 0) {
          const geocode = result.geocodes[0];
          const location = geocode.location;

          // 设置地图中心和缩放级别
          map.setCenter([location.lng, location.lat]);
          map.setZoom(11);

          // 显示行政区边界
          AMap.plugin('AMap.DistrictSearch', () => {
            const districtSearch = new AMap.DistrictSearch({
              extensions: 'all',
              subdistrict: 0,
              level: 'city',
            });

            districtSearch.search(cityName, (status: string, result: any) => {
              if (status === 'complete' && result.districtList && result.districtList.length > 0) {
                const district = result.districtList[0];
                const bounds = district.boundaries;

                if (bounds) {
                  // 绘制边界
                  for (let i = 0; i < bounds.length; i++) {
                    new AMap.Polyline({
                      path: bounds[i],
                      strokeColor: '#3B82F6',
                      strokeWeight: 2,
                      strokeOpacity: 0.8,
                      fillColor: '#3B82F6',
                      fillOpacity: 0.1,
                      map: map,
                    });
                  }

                  // 调整视野以包含边界
                  map.setFitView();
                }
              }
            });
          });
        }
      });
    });
  }, []);

  // 显示景点统计
  const showSpotStats = useCallback((stats: Map<string, number>) => {
    if (!mapRef.current || !window.AMap) return;

    // 为每个标记添加统计徽章
    markersRef.current.forEach((marker, spotId) => {
      const count = stats.get(spotId) || 0;
      if (count > 0) {
        const spot = marker.getExtData() as Spot;

        // 根据次数设置颜色
        let bgColor = '#9CA3AF'; // 灰色 - 1次
        if (count >= 4)
          bgColor = '#EF4444'; // 红色 - 4次及以上
        else if (count === 3)
          bgColor = '#F97316'; // 橙色 - 3次
        else if (count === 2) bgColor = '#3B82F6'; // 蓝色 - 2次

        // 创建带统计的标记
        const markerContent = `
          <div style="position: relative;">
            <div style="
              background: ${bgColor};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              ${spot.name.charAt(0)}
            </div>
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: ${bgColor};
              color: white;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
              border: 2px solid white;
            ">
              ${count}
            </div>
          </div>
        `;

        marker.setContent(markerContent);
      }
    });
  }, []);

  // 隐藏景点统计
  const hideSpotStats = useCallback(() => {
    markersRef.current.forEach((marker) => {
      const spot = marker.getExtData() as Spot;

      // 恢复原始标记样式
      const markerContent = `
        <div style="
          background: #3B82F6;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ${spot.name.charAt(0)}
        </div>
      `;

      marker.setContent(markerContent);
    });
  }, []);

  // 高亮指定景点（用于最终路线绘制）
  const highlightSpots = useCallback((spotIds: string[], hotSpotIds: string[]) => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker, spotId) => {
      const isHighlighted = spotIds.includes(spotId);
      const isHot = hotSpotIds.includes(spotId);

      if (isHighlighted) {
        // 高亮显示
        marker.setOpacity(1);

        // 如果是热门景点，添加特殊样式
        if (isHot) {
          const icon = new window.AMap.Icon({
            size: new window.AMap.Size(40, 50),
            image:
              'data:image/svg+xml;base64,' +
              btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
                <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" fill="#EF4444"/>
                <circle cx="20" cy="18" r="10" fill="white"/>
                <text x="20" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#EF4444">🔥</text>
              </svg>
            `),
            imageSize: new window.AMap.Size(40, 50),
          });
          marker.setIcon(icon);
        }
      } else {
        // 非高亮景点，降低透明度
        marker.setOpacity(0.3);
      }
    });
  }, []);

  return {
    map: mapRef.current,
    addSpotMarker,
    updateSpotMarkerStyle,
    removeSpotMarker,
    clearAllMarkers,
    drawRoute,
    clearRoute,
    setMapCenter,
    setMapZoom,
    setCityWithBoundary,
    showSpotStats,
    hideSpotStats,
    highlightSpots,
    isLoaded,
  };
}
