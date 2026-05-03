// 按天绘制最终路线 - 优化版
import { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  Utensils,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

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

// AI辅助生成：GLM-5, 2026-3-26
interface DayRoutePlannerProps {
  day: number;
  allMemberDrafts: any[]; // 所有成员的草案
  citySpots: Spot[]; // 城市所有景点
  onSave: (route: RouteSpotWithTime[]) => void;
  onRouteChange?: (route: RouteSpotWithTime[]) => void; // 新增：路线变化回调
}

export default function DayRoutePlanner({
  day,
  allMemberDrafts,
  citySpots,
  onSave,
  onRouteChange,
}: DayRoutePlannerProps) {
  const [daySpots, setDaySpots] = useState<SpotWithStats[]>([]);
  const [selectedSpots, setSelectedSpots] = useState<RouteSpotWithTime[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [mealReminders, setMealReminders] = useState<{ time: string; type: string }[]>([]);

  // 当路线变化时，通知父组件
  // AI辅助生成：GLM-5, 2026-3-26
  useEffect(() => {
    if (onRouteChange) {
      onRouteChange(selectedSpots);
    }
  }, [selectedSpots, onRouteChange]);

  // 计算该天被选择的景点及统计
  useEffect(() => {
    const spotMap = new Map<string, SpotWithStats>();

    // 遍历所有成员的草案
    allMemberDrafts.forEach((member: any) => {
      const draft = member.drafts.find((d: any) => d.dayNumber === day);
      if (draft) {
        const spotIds: string[] = JSON.parse(draft.spotSequence);
        spotIds.forEach((spotId) => {
          const spot = citySpots.find((s) => s.id === spotId);
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
    const sortedSpots = Array.from(spotMap.values()).sort(
      (a, b) => b.selectedCount - a.selectedCount
    );
    setDaySpots(sortedSpots);
  }, [day, allMemberDrafts, citySpots]);

  // 检测用餐时间提醒
  useEffect(() => {
    const reminders: { time: string; type: string }[] = [];

    selectedSpots.forEach((spot) => {
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
      博物馆: 180,
      博物馆馆: 180,
      美术馆: 150,
      公园: 120,
      景点: 90,
      古迹: 120,
      寺庙: 90,
      游乐场: 240,
      主题公园: 300,
      自然风光: 150,
      海滩: 180,
      购物中心: 120,
      市场: 90,
    };

    for (const [key, value] of Object.entries(categoryMap)) {
      if (category.includes(key)) {
        return value;
      }
    }

    return 120;
  };

  // 更新时间
  const handleUpdateTime = (
    index: number,
    field: 'arrivalTime' | 'duration',
    value: string | number
  ) => {
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
      newRoute[i].departureTime = calculateDepartureTime(
        newRoute[i].arrivalTime,
        newRoute[i].duration
      );
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
    const hotSpots = daySpots.filter((s) => s.selectedCount >= 2);
    hotSpots.forEach((spot) => {
      if (!selectedSpots.find((s) => s.id === spot.id)) {
        handleAddSpot(spot);
      }
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl border-t-2 border-amber-500/50 shadow-lg">
      {/* 标题栏 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-amber-500/20 backdrop-blur-md cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-amber-400" />
          <h3 className="font-semibold text-white">Day {day} 最终路线绘制</h3>
          <span className="text-sm text-amber-300">({daySpots.length}个景点被选择)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(selectedSpots);
            }}
            disabled={selectedSpots.length === 0}
            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-white/20"
          >
            保存最终路线
          </button>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-white/60" />
          ) : (
            <ChevronUp className="h-5 w-5 text-white/60" />
          )}
        </div>
      </div>

      {/* 内容区 */}
      {isExpanded && (
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* 用餐提醒 */}
          {mealReminders.length > 0 && (
            <div className="mb-4 p-3 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">用餐时间提醒</span>
              </div>
              <div className="space-y-1">
                {mealReminders.map((reminder, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-blue-300/80">
                    <AlertCircle className="h-3 w-3" />
                    <span>
                      建议在 {reminder.time} 附近安排{reminder.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* 左侧：成员路线统计 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  景点选择统计
                </h4>
                <button
                  onClick={handleAddAllHotSpots}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  一键添加热门景点
                </button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {daySpots.map((spot) => {
                  const isSelected = selectedSpots.find((s) => s.id === spot.id);
                  const isHot = spot.selectedCount >= 2;

                  return (
                    <div
                      key={spot.id}
                      className={`p-2 border rounded-lg transition-all duration-200 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer'
                      }`}
                      onClick={() => !isSelected && handleAddSpot(spot)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{spot.name}</span>
                            {isHot && (
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">
                                热门
                              </span>
                            )}
                            {isSelected && (
                              <span className="px-1.5 py-0.5 bg-amber-500/30 text-amber-300 text-xs rounded border border-amber-500/40">
                                已选
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs text-white/50">
                              <Users className="h-3 w-3" />
                              <span>{spot.selectedCount}人选择</span>
                            </div>
                            <div className="text-xs text-white/40">
                              ({spot.selectedBy.join(', ')})
                            </div>
                          </div>
                          {/* 频率条 */}
                          <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{
                                width: `${(spot.selectedCount / allMemberDrafts.length) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        {!isSelected && <Plus className="h-4 w-4 text-amber-400" />}
                      </div>
                    </div>
                  );
                })}

                {daySpots.length === 0 && (
                  <div className="text-center text-white/50 py-8 text-sm">该天暂无成员选择景点</div>
                )}
              </div>
            </div>

            {/* 右侧：最终路线编辑 */}
            <div>
              <h4 className="text-sm font-semibold text-white/80 mb-2">最终路线</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {selectedSpots.map((spot, index) => (
                  <div
                    key={spot.id}
                    className="p-2 border border-amber-500/30 rounded-lg bg-amber-500/10 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-amber-300">
                          {index + 1}. {spot.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {index > 0 && (
                          <button
                            onClick={() => handleMoveSpot(index, 'up')}
                            className="p-1 hover:bg-white/10 rounded text-xs text-white/60 hover:text-white transition-colors"
                          >
                            ↑
                          </button>
                        )}
                        {index < selectedSpots.length - 1 && (
                          <button
                            onClick={() => handleMoveSpot(index, 'down')}
                            className="p-1 hover:bg-white/10 rounded text-xs text-white/60 hover:text-white transition-colors"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveSpot(index)}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-white/50 mb-0.5">到达</label>
                        <input
                          type="time"
                          value={spot.arrivalTime}
                          onChange={(e) => handleUpdateTime(index, 'arrivalTime', e.target.value)}
                          className="w-full px-1.5 py-1 border border-white/20 rounded text-xs bg-white/10 text-white focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-0.5">时长(分)</label>
                        <input
                          type="number"
                          value={spot.duration}
                          onChange={(e) =>
                            handleUpdateTime(index, 'duration', Number(e.target.value))
                          }
                          min={15}
                          step={15}
                          className="w-full px-1.5 py-1 border border-white/20 rounded text-xs bg-white/10 text-white focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-0.5">离开</label>
                        <input
                          type="time"
                          value={spot.departureTime}
                          readOnly
                          className="w-full px-1.5 py-1 border border-white/20 rounded text-xs bg-white/5 text-white/60"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {selectedSpots.length === 0 && (
                  <div className="text-center text-white/50 py-8 text-sm">
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
