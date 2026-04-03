// 按天绘制最终路线 - 内嵌在CollabRoom页面中
import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, ChevronDown, ChevronUp, Users, Utensils, AlertCircle } from 'lucide-react';

interface Spot {
  id: string;
  name: string;
  location: string;
  category?: string;
}

interface SpotWithStats extends Spot {
  selectedCount: number; // 被选择的次数
  selectedBy: string[]; // 被哪些成员选择
}

interface RouteSpotWithTime {
  id: string;
  name: string;
  location: string;
  order: number;
  arrivalTime: string;
  duration: number;
  departureTime: string;
}

interface DayRoutePlannerProps {
  day: number;
  allMemberDrafts: any[]; // 所有成员的草案
  citySpots: Spot[]; // 城市所有景点
  onSave: (route: RouteSpotWithTime[]) => void;
}

export default function DayRoutePlanner({
  day,
  allMemberDrafts,
  citySpots,
  onSave,
}: DayRoutePlannerProps) {
  const [daySpots, setDaySpots] = useState<SpotWithStats[]>([]);
  const [selectedSpots, setSelectedSpots] = useState<RouteSpotWithTime[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [mealReminders, setMealReminders] = useState<{time: string, type: string}[]>([]);
  
  // 检测用餐时间提醒
  useEffect(() => {
    const reminders: {time: string, type: string}[] = [];
    
    selectedSpots.forEach(spot => {
      const [hours] = spot.arrivalTime.split(':').map(Number);
      const [departHours] = spot.departureTime.split(':').map(Number);
      
      // 检测是否跨越午餐时间（11:30-13:30）
      if (hours < 11.5 && departHours >= 11.5 && departHours <= 13.5) {
        reminders.push({
          time: spot.arrivalTime,
          type: '午餐',
        });
      }
      
      // 检测是否跨越晚餐时间（17:30-19:30）
      if (hours < 17.5 && departHours >= 17.5 && departHours <= 19.5) {
        reminders.push({
          time: spot.arrivalTime,
          type: '晚餐',
        });
      }
    });
    
    setMealReminders(reminders);
  }, [selectedSpots]);
  
  // 计算该天被选择的景点及统计
  useEffect(() => {
    const spotMap = new Map<string, SpotWithStats>();
    
    // 遍历所有成员的草案
    allMemberDrafts.forEach((member: any) => {
      const draft = member.drafts.find((d: any) => d.dayNumber === day);
      if (draft) {
        const spotIds: string[] = JSON.parse(draft.spotSequence);
        spotIds.forEach(spotId => {
          const spot = citySpots.find(s => s.id === spotId);
          if (spot) {
            if (spotMap.has(spotId)) {
              const existing = spotMap.get(spotId)!;
              existing.selectedCount++;
              existing.selectedBy.push(member.username);
            } else {
              spotMap.set(spotId, {
                ...spot,
                selectedCount: 1,
                selectedBy: [member.username],
              });
            }
          }
        });
      }
    });
    
    // 按选择次数排序
    const sortedSpots = Array.from(spotMap.values()).sort((a, b) => b.selectedCount - a.selectedCount);
    setDaySpots(sortedSpots);
  }, [day, allMemberDrafts, citySpots]);
  
  // 添加景点到最终路线
  const handleAddSpot = (spot: SpotWithStats) => {
    // 计算到达时间
    let arrivalTime = '09:00';
    if (selectedSpots.length > 0) {
      arrivalTime = selectedSpots[selectedSpots.length - 1].departureTime;
    }
    
    // 使用推荐时长
    const recommendedDuration = getRecommendedDuration(spot.category);
    
    const newSpot: RouteSpotWithTime = {
      id: spot.id,
      name: spot.name,
      location: spot.location,
      order: selectedSpots.length + 1,
      arrivalTime,
      duration: recommendedDuration,
      departureTime: calculateDepartureTime(arrivalTime, recommendedDuration),
    };
    
    setSelectedSpots([...selectedSpots, newSpot]);
  };
  
  // 计算离开时间
  const calculateDepartureTime = (arrival: string, duration: number): string => {
    const [hours, minutes] = arrival.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };
  
  // 根据景点类型推荐游玩时长（分钟）
  const getRecommendedDuration = (category?: string): number => {
    if (!category) return 120; // 默认2小时
    
    const categoryMap: Record<string, number> = {
      '博物馆': 180,      // 3小时
      '博物馆馆': 180,
      '美术馆': 150,      // 2.5小时
      '公园': 120,        // 2小时
      '景点': 90,         // 1.5小时
      '古迹': 120,        // 2小时
      '寺庙': 90,         // 1.5小时
      '游乐场': 240,      // 4小时
      '主题公园': 300,    // 5小时
      '自然风光': 150,    // 2.5小时
      '海滩': 180,        // 3小时
      '购物中心': 120,    // 2小时
      '市场': 90,         // 1.5小时
    };
    
    // 模糊匹配
    for (const [key, value] of Object.entries(categoryMap)) {
      if (category.includes(key)) {
        return value;
      }
    }
    
    return 120; // 默认2小时
  };
  
  // 更新时间
  const handleUpdateTime = (index: number, field: 'arrivalTime' | 'duration', value: string | number) => {
    const newRoute = [...selectedSpots];
    const spot = newRoute[index];
    
    if (field === 'arrivalTime') {
      spot.arrivalTime = value as string;
      spot.departureTime = calculateDepartureTime(spot.arrivalTime, spot.duration);
    } else {
      spot.duration = value as number;
      spot.departureTime = calculateDepartureTime(spot.arrivalTime, spot.duration);
    }
    
    // 更新后续景点
    for (let i = index + 1; i < newRoute.length; i++) {
      newRoute[i].arrivalTime = newRoute[i - 1].departureTime;
      newRoute[i].departureTime = calculateDepartureTime(newRoute[i].arrivalTime, newRoute[i].duration);
    }
    
    setSelectedSpots(newRoute);
  };
  
  // 移除景点
  const handleRemoveSpot = (index: number) => {
    const newRoute = selectedSpots.filter((_, i) => i !== index);
    newRoute.forEach((spot, i) => {
      spot.order = i + 1;
      if (i > 0) {
        spot.arrivalTime = newRoute[i - 1].departureTime;
        spot.departureTime = calculateDepartureTime(spot.arrivalTime, spot.duration);
      }
    });
    setSelectedSpots(newRoute);
  };
  
  // 移动景点
  const handleMoveSpot = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedSpots.length) return;
    
    const newRoute = [...selectedSpots];
    [newRoute[index], newRoute[newIndex]] = [newRoute[newIndex], newRoute[index]];
    
    newRoute.forEach((spot, i) => {
      spot.order = i + 1;
      if (i === 0) {
        spot.arrivalTime = '09:00';
      } else {
        spot.arrivalTime = newRoute[i - 1].departureTime;
      }
      spot.departureTime = calculateDepartureTime(spot.arrivalTime, spot.duration);
    });
    
    setSelectedSpots(newRoute);
  };
  
  // 一键添加所有热门景点（被2人以上选择）
  const handleAddAllHotSpots = () => {
    const hotSpots = daySpots.filter(s => s.selectedCount >= 2);
    hotSpots.forEach(spot => {
      if (!selectedSpots.find(s => s.id === spot.id)) {
        handleAddSpot(spot);
      }
    });
  };
  
  return (
    <div className="bg-white border-t-2 border-amber-500 shadow-lg">
      {/* 标题栏 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-amber-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-amber-900">Day {day} 最终路线绘制</h3>
          <span className="text-sm text-amber-600">({daySpots.length}个景点被选择)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(selectedSpots);
            }}
            disabled={selectedSpots.length === 0}
            className="px-3 py-1 bg-amber-500 text-white rounded text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            保存
          </button>
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </div>
      </div>
      
      {/* 内容区 */}
      {isExpanded && (
        <div className="p-4">
          {/* 用餐提醒 */}
          {mealReminders.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">用餐时间提醒</span>
              </div>
              <div className="space-y-1">
                {mealReminders.map((reminder, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-blue-700">
                    <AlertCircle className="h-3 w-3" />
                    <span>建议在 {reminder.time} 附近安排{reminder.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {/* 左侧：可选景点 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">可选景点</h4>
              <button
                onClick={handleAddAllHotSpots}
                className="text-xs text-amber-600 hover:text-amber-700"
              >
                一键添加热门景点
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {daySpots.map(spot => {
                const isSelected = selectedSpots.find(s => s.id === spot.id);
                const isHot = spot.selectedCount >= 2;
                
                return (
                  <div
                    key={spot.id}
                    className={`p-2 border rounded-lg ${
                      isSelected ? 'bg-gray-100 opacity-50' : 'bg-white hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => !isSelected && handleAddSpot(spot)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{spot.name}</span>
                          {isHot && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                              热门
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>{spot.selectedCount}人选择</span>
                          <span className="text-gray-400">({spot.selectedBy.join(', ')})</span>
                        </div>
                      </div>
                      {!isSelected && (
                        <Plus className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                );
              })}
              
              {daySpots.length === 0 && (
                <div className="text-center text-gray-500 py-8 text-sm">
                  该天暂无成员选择景点
                </div>
              )}
            </div>
          </div>
          
          {/* 右侧：已选路线 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">最终路线</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedSpots.map((spot, index) => (
                <div key={spot.id} className="p-2 border border-amber-200 rounded-lg bg-amber-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-amber-900">
                        {index + 1}. {spot.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {index > 0 && (
                        <button
                          onClick={() => handleMoveSpot(index, 'up')}
                          className="p-1 hover:bg-amber-200 rounded text-xs"
                        >
                          ↑
                        </button>
                      )}
                      {index < selectedSpots.length - 1 && (
                        <button
                          onClick={() => handleMoveSpot(index, 'down')}
                          className="p-1 hover:bg-amber-200 rounded text-xs"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveSpot(index)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">到达</label>
                      <input
                        type="time"
                        value={spot.arrivalTime}
                        onChange={(e) => handleUpdateTime(index, 'arrivalTime', e.target.value)}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">时长(分)</label>
                      <input
                        type="number"
                        value={spot.duration}
                        onChange={(e) => handleUpdateTime(index, 'duration', Number(e.target.value))}
                        min={15}
                        step={15}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">离开</label>
                      <input
                        type="time"
                        value={spot.departureTime}
                        readOnly
                        className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {selectedSpots.length === 0 && (
                <div className="text-center text-gray-500 py-8 text-sm">
                  点击左侧景点添加到路线
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
