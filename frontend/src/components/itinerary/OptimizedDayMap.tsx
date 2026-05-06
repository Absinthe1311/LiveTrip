// 优化的地图组件 - 支持动态更新和多种显示模式，带标记、名称和点击卡片
import React, { useEffect, useRef, useState } from 'react';
import { Hotel, Restaurant } from '../../api/recommendationApi';
import AMapLoader from '@amap/amap-jsapi-loader';

interface OptimizedDayMapProps {
  day?: any;
  hotel?: Hotel | null;
  restaurant?: Restaurant | null;
  showAllRestaurants?: boolean;
  showAllDays?: boolean;
  allDays?: any[];
  restaurantRecommendations?: Restaurant[];
  hotelRecommendations?: Hotel[];
  onMapUpdate?: () => void;
}

// 信息卡片组件
function InfoCard({ item, onClose }: { item: any; onClose: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow-xl p-4 min-w-[280px] z-[1000]">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {item.description && (
        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
      )}
      {item.rating && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-amber-400">⭐</span>
          <span className="text-sm font-semibold text-gray-700">{item.rating.toFixed(1)}</span>
        </div>
      )}
      {item.type && (
        <div className="text-sm text-gray-500 mb-2">
          <span className="inline-block px-2 py-1 bg-gray-100 rounded">{item.type}</span>
        </div>
      )}
      {item.address && (
        <div className="text-xs text-gray-400">{item.address}</div>
      )}
    </div>
  );
}

export default function OptimizedDayMap({
  day,
  hotel,
  restaurant,
  showAllRestaurants = false,
  showAllDays = false,
  allDays = [],
  restaurantRecommendations = [],
  hotelRecommendations = [],
  onMapUpdate
}: OptimizedDayMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [infoWindowPosition, setInfoWindowPosition] = useState<{ x: number; y: number } | null>(null);
  const amapKey = import.meta.env.VITE_AMAP_JS_KEY;
  const amapSecret = import.meta.env.VITE_AMAP_JS_SECRET;

  // 点击标记显示信息卡片
  const handleMarkerClick = (item: any, position: number[]) => {
    setSelectedItem(item);
    if (mapRef.current && position.length >= 2) {
      const pixel = mapRef.current.lnglatTocontainer((window as any).AMap.LngLat(position[0], position[1]));
      setInfoWindowPosition({ x: pixel.x, y: pixel.y - 50 });
    }
  };

  // 关闭信息卡片
  const handleCloseInfoWindow = () => {
    setSelectedItem(null);
    setInfoWindowPosition(null);
  };

  useEffect(() => {
    if (!mapContainer.current || !amapKey) return;
    if (!showAllDays && (!day || !day.attractions)) return;
    if (showAllDays && !allDays) return;

    window._AMapSecurityConfig = {
      securityJsCode: amapSecret,
    };

    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.Marker']
    }).then((AMap) => {
      // 收集所有坐标点
      let coordinates: number[][] = [];
      const daysToShow = showAllDays ? allDays : [day];
      
      // 为每一天收集坐标点
      daysToShow.forEach((currentDay: any) => {
        if (!currentDay || !currentDay.attractions) return;

        currentDay.attractions.forEach((item: any) => {
          if (item.location) {
            coordinates.push(item.location.split(',').map(Number));
          }
        });
      });

      // 添加酒店坐标
      if (hotel?.location) {
        coordinates.push(hotel.location.split(',').map(Number));
      }

      // 添加餐厅坐标
      if (showAllRestaurants && restaurantRecommendations) {
        restaurantRecommendations.forEach((rest: Restaurant) => {
          if (rest.location) {
            coordinates.push(rest.location.split(',').map(Number));
          }
        });
      } else if (restaurant?.location) {
        coordinates.push(restaurant.location.split(',').map(Number));
      }

      // 如果没有坐标点，不初始化地图
      if (coordinates.length === 0) return;

      // 计算中心点
      const centerLng = coordinates.reduce((sum, coords) => sum + coords[0], 0) / coordinates.length;
      const centerLat = coordinates.reduce((sum, coords) => sum + coords[1], 0) / coordinates.length;

      // 清除旧的标记和路线
      if (mapRef.current) {
        markersRef.current.forEach(marker => mapRef.current.remove(marker));
        polylinesRef.current.forEach(polyline => mapRef.current.remove(polyline));
        markersRef.current = [];
        polylinesRef.current = [];
      }

      // 初始化或更新地图
      const map = mapRef.current || new AMap.Map(mapContainer.current, {
        zoom: showAllDays ? 12 : 14,
        center: [centerLng, centerLat],
        mapStyle: 'amap://styles/dark',
      });

      if (!mapRef.current) {
        mapRef.current = map;
      } else {
        map.setCenter([centerLng, centerLat]);
        map.setZoom(showAllDays ? 12 
      }

      // 为每一天添加景点坐标和标记
      daysToShow.forEach((currentDay: any, dayIndex: number) => {
        if (!currentDay || !currentDay.attractions) return;

        currentDay.attractions.forEach((item: any, index: number) => {
          if (!item.location) return;
          
          const coords = item.location.split(',').map(Number);

          // 景点标记 - 使用标准地图标记样式
          const marker = new AMap.Marker({
            position: coords,
            title: item.name,
            content: `
              <div class="map-marker-container" style="position: relative; cursor: pointer;">
                <!-- 地图标记图标 -->
                <div style="
                  width: 36px;
                  height: 36px;
                  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                  border-radius: 50% 50% 50% 0;
                  transform: rotate(-45deg);
                  border: 3px solid #fff;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <div style="
                    transform: rotate(45deg);
                    color: #fff;
                    font-weight: bold;
                    font-size: 14px;
                  ">
                    ${showAllDays ? `D${dayIndex + 1}` : index + 1}
                  </div>
                </div>
                <!-- 地点名称标签 -->
                <div style="
                  position: absolute;
                  top: -30px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: rgba(255, 255, 255, 0.95);
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: 500;
                  color: #1f2937;
                  white-space: nowrap;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  border: 1px solid #e5e7eb;
                ">
                  ${item.name}
                </div>
              </div>
            `,
            offset: new AMap.Pixel(-18, -36),
            zIndex: 100
          });

          // 点击标记事件
          marker.on('click', () => {
            handleMarkerClick(item, coords);
          });

          map.add(marker);
          markersRef.current.push(marker);
        });

        // 为每天添加路线
        if (currentDay.attractions.length > 1) {
          const path = currentDay.attractions
            .filter((item: any) => item.location)
            .map((item: any) => item.location.split(',').map(Number));

          if (path.length > 1) {
            const dayColor = showAllDays 
              ? ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][dayIndex % 5]
              : '#f59e0b';

            const polyline = new AMap.Polyline({
              path: path,
              borderWeight: 3,
              strokeColor: dayColor,
              lineJoin: 'round',
              strokeOpacity: 0.9,
              strokeWidth: 4,
              strokeStyle: 'solid',
              zIndex: 50,
              showDir: true
            });

            map.add(polyline);
            polylinesRef.current.push(polyline);
          }
        }
      });

      // 添加酒店标记（如果有）
      if (hotel?.location) {
        const hotelCoords = hotel.location.split(',').map(Number);

        const hotelMarker = new AMap.Marker({
          position: hotelCoords,
          title: hotel.name,
          content: `
            <div class="map-marker-container" style="position: relative; cursor: pointer;">
              <div style="
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="transform: rotate(45deg); font-size: 18px;">🏨</div>
              </div>
              <div style="
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 255, 255, 0.95);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                color: #1f2937;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border: 1px solid #e5e7eb;
              ">
                ${hotel.name}
              </div>
            </div>
          `,
          offset: new AMap.Pixel(-20, -40),
          zIndex: 90
        });

        hotelMarker.on('click', () => {
          handleMarkerClick(hotel, hotelCoords);
        });

        map.add(hotelMarker);
        markersRef.current.push(hotelMarker);
      }

      // 添加待选酒店标记（如果有）
      if (hotelRecommendations && hotelRecommendations.length > 0) {
        hotelRecommendations.forEach((candHotel: Hotel) => {
          if (candHotel.location) {
            const isHotelSelected = hotel?.name === candHotel.name;
            const candHotelCoords = candHotel.location.split(',').map(Number);

            const candHotelMarker = new AMap.Marker({
              position: candHotelCoords,
              title: candHotel.name,
              content: `
                <div class="map-marker-container" style="position: relative; cursor: pointer;">
                  <div style="
                    width: ${isHotelSelected ? '40px' : '32px'};
                    height: ${isHotelSelected ? '40px' : '32px'};
                    background: ${isHotelSelected 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'};
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: ${isHotelSelected ? '3px' : '2px'} solid #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <div style="transform: rotate(45deg); font-size: ${isHotelSelected ? '18px' : '14px'};">🏨</div>
                  </div>
                  <div style="
                    position: absolute;
                    top: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(255, 255, 255, 0.95);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                    color: #1f2937;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                  ">
                    ${candHotel.name}
                  </div>
                </div>
              `,
              offset: new AMap.Pixel(isHotelSelected ? -20 : -16, isHotelSelected ? -40 : -32),
              zIndex: isHotelSelected ? 90 : 85
            });

            candHotelMarker.on('click', () => {
              handleMarkerClick(candHotel, candHotelCoords);
            });

            map.add(candHotelMarker);
            markersRef.current.push(candHotelMarker);
          }
        });
      }

      // 添加餐厅标记
      if (showAllRestaurants && restaurantRecommendations) {
        // 显示所有推荐餐厅
        restaurantRecommendations.forEach((rest: Restaurant) => {
          if (rest.location) {
            const restCoords = rest.location.split(',').map(Number);

            const isRestaurant = restaurant?.name === rest.name;
            const restMarker = new AMap.Marker({
              position: restCoords,
              title: rest.name,
              content: `
                <div class="map-marker-container" style="position: relative; cursor: pointer;">
                  <div style="
                    width: ${isRestaurant ? '40px' : '32px'};
                    height: ${isRestaurant ? '40px' : '32px'};
                    background: ${isRestaurant 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'};
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: ${isRestaurant ? '3px' : '2px'} solid #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <div style="transform: rotate(45deg); font-size: ${isRestaurant ? '18px' : '14px'};">🍽️</div>
                  </div>
                  <div style="
                    position: absolute;
                    top: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(255, 255, 255, 0.95);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                    color: #1f2937;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                  ">
                    ${rest.name}
                  </div>
                </div>
              `,
              offset: new AMap.Pixel(isRestaurant ? -20 : -16, isRestaurant ? -40 : -32),
              zIndex: isRestaurant ? 95 : 80
            });

            restMarker.on('click', () => {
              handleMarkerClick(rest, restCoords);
            });

            map.add(restMarker);
            markersRef.current.push(restMarker);
          }
        });
      } else if (restaurant?.location) {
        // 只显示选中的餐厅
        const restCoords = restaurant.location.split(',').map(Number);

        const restMarker = new AMap.Marker({
          position: restCoords,
          title: restaurant.name,
          content: `
            <div class="map-marker-container" style="position: relative; cursor: pointer;">
              <div style="
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="transform: rotate(45deg); font-size: 18px;">🍽️</div>
              </div>
              <div style="
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 255, 255, 0.95);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                color: #1f2937;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border: 1px solid #e5e7eb;
              ">
                ${restaurant.name}
              </div>
            </div>
          `,
          offset: new AMap.Pixel(-20, -40),
          zIndex: 95
        });

        restMarker.on('click', () => {
          handleMarkerClick(restaurant, restCoords);
        });

        map.add(restMarker);
        markersRef.current.push(restMarker);
      }

      map.setFitView();

      // 地图点击关闭信息卡片
      map.on('click', () => {
        handleCloseInfoWindow();
      });

      // 通知地图已更新
      if (onMapUpdate) {
        onMapUpdate();
      }

    }).catch((e) => {
      console.error('高德地图加载失败:', e);
    });

    return () => {
      if (mapRef.current) {
        markersRef.current.forEach(marker => mapRef.current.remove(marker));
        polylinesRef.current.forEach(polyline => mapRef.current.remove(polyline));
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [day, amapKey, hotel, restaurant, showAllRestaurants, showAllDays, allDays, restaurantRecommendations, hotelRecommendations]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative">
      <div ref={mapContainer} className="w-full h-full" />
      {!amapKey && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white z-50">
          高德地图 Key 未配置
        </div>
      )}
      {/* 信息卡片 */}
      {selectedItem && infoWindowPosition && (
        <div 
          className="absolute z-[1000]"
          style={{
            left: `${infoWindowPosition.x}px`,
            top: `${infoWindowPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <InfoCard item={selectedItem} onClose={handleCloseInfoWindow} />
        </div>
      )}
    </div>
  );
}
