// 最终路线编辑器 - 房主绘制最终路线
import { useState, useEffect } from 'react';
import { MapPin, Trash2, GripVertical, Save, X } from 'lucide-react';

interface Spot {
  id: string;
  name: string;
  location: string;
  category?: string;
}

interface RouteSpotWithTime {
  id: string;
  name: string;
  location: string;
  order: number;
  arrivalTime: string;
  duration: number; // 分钟
  departureTime: string;
}

interface FinalRouteEditorProps {
  spots: Spot[];
  initialRoute: RouteSpotWithTime[];
  onSave: (route: RouteSpotWithTime[]) => void;
  onCancel: () => void;
  onRouteChange?: (route: RouteSpotWithTime[]) => void; // 新增：路线变化回调
}

export default function FinalRouteEditor({
  spots,
  initialRoute,
  onSave,
  onCancel,
  onRouteChange,
}: FinalRouteEditorProps) {
  const [routeSpots, setRouteSpots] = useState<RouteSpotWithTime[]>(initialRoute);
  const [selectedSpotId, setSelectedSpotId] = useState<string>('');
  
  // 当路线变化时，通知父组件
  useEffect(() => {
    if (onRouteChange) {
      onRouteChange(routeSpots);
    }
  }, [routeSpots, onRouteChange]);
  
  // 添加景点到路线
  const handleAddSpot = () => {
    if (!selectedSpotId) return;
    
    const spot = spots.find(s => s.id === selectedSpotId);
    if (!spot) return;
    
    // 计算到达时间（基于上一个景点的离开时间）
    let arrivalTime = '09:00';
    if (routeSpots.length > 0) {
      const lastSpot = routeSpots[routeSpots.length - 1];
      arrivalTime = lastSpot.departureTime;
    }
    
    const newSpot: RouteSpotWithTime = {
      id: spot.id,
      name: spot.name,
      location: spot.location,
      order: routeSpots.length + 1,
      arrivalTime,
      duration: 120, // 默认2小时
      departureTime: calculateDepartureTime(arrivalTime, 120),
    };
    
    setRouteSpots([...routeSpots, newSpot]);
    setSelectedSpotId('');
  };
  
  // 计算离开时间
  const calculateDepartureTime = (arrival: string, duration: number): string => {
    const [hours, minutes] = arrival.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };
  
  // 更新景点时间
  const handleUpdateTime = (index: number, field: 'arrivalTime' | 'duration', value: string | number) => {
    const newRoute = [...routeSpots];
    const spot = newRoute[index];
    
    if (field === 'arrivalTime') {
      spot.arrivalTime = value as string;
      spot.departureTime = calculateDepartureTime(spot.arrivalTime, spot.duration);
    } else {
      spot.duration = value as number;
      spot.departureTime = calculateDepartureTime(spot.arrivalTime, spot.duration);
    }
    
    // 更新后续景点的到达时间
    for (let i = index + 1; i < newRoute.length; i++) {
      newRoute[i].arrivalTime = newRoute[i - 1].departureTime;
      newRoute[i].departureTime = calculateDepartureTime(newRoute[i].arrivalTime, newRoute[i].duration);
    }
    
    setRouteSpots(newRoute);
  };
  
  // 移除景点
  const handleRemoveSpot = (index: number) => {
    const newRoute = routeSpots.filter((_, i) => i !== index);
    // 重新计算顺序和时间
    newRoute.forEach((spot, i) => {
      spot.order = i + 1;
      if (i > 0) {
        spot.arrivalTime = newRoute[i - 1].departureTime;
        spot.departureTime = calculateDepartureTime(spot.arrivalTime, spot.duration);
      }
    });
    setRouteSpots(newRoute);
  };
  
  // 移动景点
  const handleMoveSpot = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= routeSpots.length) return;
    
    const newRoute = [...routeSpots];
    [newRoute[index], newRoute[newIndex]] = [newRoute[newIndex], newRoute[index]];
    
    // 重新计算顺序和时间
    newRoute.forEach((spot, i) => {
      spot.order = i + 1;
      if (i === 0) {
        spot.arrivalTime = '09:00';
      } else {
        spot.arrivalTime = newRoute[i - 1].departureTime;
      }
      spot.departureTime = calculateDepartureTime(spot.arrivalTime, spot.duration);
    });
    
    setRouteSpots(newRoute);
  };
  
  return (
    <div className="bg-white rounded-lg border border-border shadow-lg p-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">绘制最终路线</h3>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* 添加景点 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">添加景点</label>
        <div className="flex gap-2">
          <select
            value={selectedSpotId}
            onChange={(e) => setSelectedSpotId(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="">选择景点...</option>
            {spots
              .filter(s => !routeSpots.find(r => r.id === s.id))
              .map(spot => (
                <option key={spot.id} value={spot.id}>
                  {spot.name}
                </option>
              ))}
          </select>
          <button
            onClick={handleAddSpot}
            disabled={!selectedSpotId}
            className="px-4 py-2 bg-livetrip-primary text-white rounded-lg text-sm font-medium hover:bg-livetrip-primary/90 disabled:opacity-50"
          >
            添加
          </button>
        </div>
      </div>
      
      {/* 路线列表 */}
      <div className="space-y-3 mb-4">
        {routeSpots.map((spot, index) => (
          <div key={spot.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-sm">{index + 1}. {spot.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {index > 0 && (
                  <button
                    onClick={() => handleMoveSpot(index, 'up')}
                    className="p-1 hover:bg-gray-200 rounded text-xs"
                  >
                    ↑
                  </button>
                )}
                {index < routeSpots.length - 1 && (
                  <button
                    onClick={() => handleMoveSpot(index, 'down')}
                    className="p-1 hover:bg-gray-200 rounded text-xs"
                  >
                    ↓
                  </button>
                )}
                <button
                  onClick={() => handleRemoveSpot(index)}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">到达时间</label>
                <input
                  type="time"
                  value={spot.arrivalTime}
                  onChange={(e) => handleUpdateTime(index, 'arrivalTime', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">停留时长(分钟)</label>
                <input
                  type="number"
                  value={spot.duration}
                  onChange={(e) => handleUpdateTime(index, 'duration', Number(e.target.value))}
                  min={15}
                  step={15}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">离开时间</label>
                <input
                  type="time"
                  value={spot.departureTime}
                  readOnly
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-100"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {routeSpots.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>请添加景点到路线中</p>
        </div>
      )}
      
      {/* 保存按钮 */}
      <button
        onClick={() => onSave(routeSpots)}
        disabled={routeSpots.length === 0}
        className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Save className="h-4 w-4" />
        保存最终路线
      </button>
    </div>
  );
}
