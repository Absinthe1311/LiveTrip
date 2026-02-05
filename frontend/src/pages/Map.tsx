import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { List, Card, Typography } from 'antd';
import { useAppStore } from '../store';

const { Text, Title } = Typography;

// 高德地图类型定义
declare global {
  interface Window {
    AMap: any;
  }
}

interface AMapInstance {
  setCenter: (lnglat: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setFitView: () => void;
  add: (overlay: any) => void;
  remove: (overlay: any) => void;
  destroy: () => void;
  on: (event: string, handler: Function) => void;
  clearMap: () => void;
}

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapInstance | null>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const amapKey = import.meta.env.VITE_AMAP_KEY;
  const currentItinerary = useAppStore((state) => state.currentItinerary);

  const [selectedAttraction, setSelectedAttraction] = useState<{
    name: string;
    time: string;
    coordinates: [number, number];
  } | null>(null);

  // 初始化地图
  useEffect(() => {
    if (!mapContainer.current || !amapKey) {
      if (!amapKey) {
        console.error('高德地图 Key 未配置，请在 .env 文件中设置 VITE_AMAP_KEY');
      }
      return;
    }

    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.ControlBar']
    }).then((AMap) => {
      const map = new AMap.Map(mapContainer.current, {
        zoom: 11,
        center: [116.3970, 39.9165], // 北京故宫
        viewMode: '2D',
        mapStyle: 'amap://styles/normal'
      });

      // 添加工具条
      map.addControl(new AMap.ToolBar({
        position: {
          top: '110px',
          right: '40px'
        }
      }));

      // 添加比例尺
      map.addControl(new AMap.Scale());

      mapRef.current = map;

      // 地图加载完成后添加标记和路线
      map.on('complete', () => {
        addMarkersAndRoutes();
      });
    }).catch((e) => {
      console.error('高德地图加载失败:', e);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, [currentItinerary]); // 当行程数据变化时重新初始化地图

  // 添加标记和路线
  const addMarkersAndRoutes = () => {
    if (!mapRef.current || !currentItinerary || !currentItinerary.itinerary) return;

    // 清除旧的标记和路线
    markersRef.current.forEach(marker => mapRef.current?.remove(marker));
    markersRef.current = [];
    polylinesRef.current.forEach(polyline => mapRef.current?.remove(polyline));
    polylinesRef.current = [];

    const AMap = window.AMap;

    // 为每一天添加标记和路线
    currentItinerary.itinerary.forEach((day: any) => {
      const dayColor = day.day === 1 ? '#667eea' : day.day === 2 ? '#764ba2' : '#f093fb';

      // 添加景点标记
      day.attractions.forEach((item: any) => {
        const coords = item.location.split(',').map(Number) as [number, number];

        const marker = new AMap.Marker({
          position: coords,
          title: item.name,
          content: `
            <div style="
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, ${dayColor} 0%, ${day.day === 1 ? '#764ba2' : day.day === 2 ? '#f093fb' : '#fa709a'} 100%);
              border-radius: 50%;
              border: 3px solid #fff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: transform 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: bold;
              font-size: 14px;
            " onmouseenter="this.style.transform='scale(1.2)'" onmouseleave="this.style.transform='scale(1)'">
              ${day.day}
            </div>
          `,
          offset: new AMap.Pixel(-16, -16)
        });

        // 点击标记显示信息窗口
        marker.on('click', () => {
          showInfoWindow(item);
        });

        mapRef.current!.add(marker);
        markersRef.current.push(marker);
      });

      // 添加景点之间的路线
      if (day.attractions.length > 1) {
        const path = day.attractions.map((item: any) => item.location.split(',').map(Number) as [number, number]);

        const polyline = new AMap.Polyline({
          path: path,
          borderWeight: 2,
          strokeColor: dayColor,
          lineJoin: 'round',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          strokeStyle: 'solid'
        });

        mapRef.current!.add(polyline);
        polylinesRef.current.push(polyline);
      }
    });

    // 自适应显示所有标记
    mapRef.current.setFitView();
  };

  // 显示信息窗口
  const showInfoWindow = (item: any) => {
    if (!mapRef.current) return;

    const AMap = window.AMap;
    const coords = item.location.split(',').map(Number) as [number, number];

    const infoWindow = new AMap.InfoWindow({
      content: `
        <div style="padding: 12px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${item.name}</h3>
          <p style="margin: 0; color: #667eea; font-weight: 500;">${item.time}</p>
        </div>
      `,
      offset: new AMap.Pixel(0, -30)
    });

    infoWindow.open(mapRef.current, coords);
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 64px)',
      background: '#f5f5f5'
    }}>
      {/* 左侧景点列表 */}
      <div style={{
        width: '350px',
        background: '#fff',
        borderRight: '1px solid #e8e8e8',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e8e8e8',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff'
        }}>
          <Title level={3} style={{ margin: 0, color: '#fff' }}>
            行程地图
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            点击景点查看详情
          </Text>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {currentItinerary && currentItinerary.itinerary ? (
            currentItinerary.itinerary.map((day: any) => (
              <Card
                key={day.day}
                title={`第 ${day.day} 天 - ${day.date}`}
                style={{
                  marginBottom: '16px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                bodyStyle={{ padding: '12px' }}
              >
                <List
                  dataSource={day.attractions}
                  renderItem={(item: any, index: number) => (
                    <List.Item
                      key={index}
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        background: selectedAttraction?.name === item.name ? '#f0f5ff' : 'transparent'
                      }}
                      onClick={() => {
                        const coords = item.location.split(',').map(Number) as [number, number];
                        setSelectedAttraction({
                          name: item.name,
                          time: item.time,
                          coordinates: coords,
                        });
                        if (mapRef.current) {
                          mapRef.current.setCenter(coords);
                          mapRef.current.setZoom(14);
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = selectedAttraction?.name === item.name ? '#f0f5ff' : 'transparent';
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          color: '#667eea',
                          fontWeight: 600,
                          marginBottom: '4px',
                          fontSize: '13px'
                        }}>
                          {item.time}
                        </div>
                        <div style={{
                          fontWeight: 500,
                          marginBottom: '4px',
                          fontSize: '15px'
                        }}>
                          {item.name}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              暂无行程数据
            </div>
          )}
        </div>
      </div>

      {/* 右侧地图 */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div
          ref={mapContainer}
          style={{
            width: '100%',
            height: '100%'
          }}
        />
        {!amapKey && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Card style={{ maxWidth: '400px', textAlign: 'center' }}>
              <Title level={4} style={{ color: '#f5222d' }}>
                高德地图 Key 未配置
              </Title>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                请在项目根目录的 .env 文件中配置高德地图 Key
              </p>
              <code style={{
                display: 'block',
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                VITE_AMAP_KEY=你的key
              </code>
              <p style={{ color: '#666', fontSize: '13px' }}>
                前往 <a href="https://console.amap.com/dev/key/app" target="_blank" rel="noopener noreferrer">https://console.amap.com/dev/key/app</a> 注册申请
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
