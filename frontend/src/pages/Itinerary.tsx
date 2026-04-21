// 行程规划优化版页面 - 集成所有新组件

// 人工修复：GLM-4, 2026-4-21
// 修复问题：
// 1. 修复TypeScript类型比较错误（第712、713、718行）
// 2. 使用类型断言 'as string' 放宽类型检查
// 3. 原因：TypeScript将currentStep?.type推断为过于具体的类型
// 4. 修复前：currentStep?.type === 'hotels'（类型不重叠错误）
// 5. 修复后：(currentStep?.type as string) === 'hotels'（编译通过）
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message, Spin } from 'antd';
import {
  MapPin, Calendar, Wallet, Cloud, Share2, Check, ChevronRight
} from "lucide-react";
import GlassLayout from '../components/layout/GlassLayout';
import TimelineWithCards from '../components/itinerary/TimelineWithCards';
import LinearStepNavigation, { PlanningStep } from '../components/itinerary/LinearStepNavigation';
import FullscreenMap from '../components/itinerary/FullscreenMap';
import BudgetBar from '../components/itinerary/BudgetBar';
import { PackingListWidget } from '../components/itinerary/PackingListWidget';
import ActionButton from '../components/itinerary/ActionButton';
import DayMapComponent from '../components/itinerary/DayMap';
import PackingStep, { PackingItemData } from '../components/itinerary/PackingStep';
import { useAppStore } from '../store';
import { FullItinerary, AttractionItem, calculateRealTimeBudget, completeTrip } from '../api/client';
import { getIoTData, saveTrip, getSpotCoverImage, batchGetSpotImagesByIds, addPackingItem, updatePackingItem, getPackingList, savePackingList } from '../api/client';
import { Hotel, Restaurant, getHotelRecommendations, getRestaurantRecommendations } from '../api/recommendationApi';
import { alternativeRecommender } from '../services/alternativeRecommender';
import AMapLoader from '@amap/amap-jsapi-loader';

// 高德地图类型定义
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

export default function Itinerary() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentItinerary = useAppStore((state) => state.currentItinerary);
  const setCurrentItinerary = useAppStore((state) => state.setCurrentItinerary);

  // 状态管理
  const [itineraryData, setItineraryData] = useState<FullItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [iotData, setIoTData] = useState<any[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRestaurants, setSelectedRestaurants] = useState<Record<number, Restaurant>>({});
  const [spotImages, setSpotImages] = useState<Record<string, string>>({}); // 景点图片映射
  const [restaurantRecommendations, setRestaurantRecommendations] = useState<Record<number, Restaurant[]>>({}); // 餐厅推荐
  const [hotelRecommendations, setHotelRecommendations] = useState<Hotel[]>([]); // 酒店推荐
  const [realTimeBudget, setRealTimeBudget] = useState<any>(null); // 实时预算

  // 地图优化相关状态
  const [showAllRestaurants, setShowAllRestaurants] = useState(false); // 是否显示所有餐厅
  const [showAllDays, setShowAllDays] = useState(false); // 是否显示所有天数

  // 步骤导航状态
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [steps, setSteps] = useState<PlanningStep[]>([]);

  // 卡片高度状态（用于动态时间轴对齐）
  const [cardHeights, setCardHeights] = useState<number[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // 备选景点状态
  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, any[]>>({});
  const [loadingAlternatives, setLoadingAlternatives] = useState<Record<string, boolean>>({});

  // 打包清单状态
  const [packingItems, setPackingItems] = useState<any[]>([]);

  // 从URL参数或store获取行程数据
  const tripId = new URLSearchParams(location.search).get('tripId');

  useEffect(() => {
    console.log('📍 ItineraryOptimized 页面加载');
    console.log('📦 Store 中的行程数据:', currentItinerary);

    if (currentItinerary) {
      console.log('✅ 找到行程数据，设置到页面状态');
      setItineraryData(currentItinerary);

      // 恢复酒店信息
      if (currentItinerary.hotel) {
        console.log('🏨 恢复酒店信息:', currentItinerary.hotel);
        setSelectedHotel(currentItinerary.hotel);
      }

      // 恢复餐厅信息
      if (currentItinerary.restaurants) {
        console.log('🍽️ 恢复餐厅信息:', currentItinerary.restaurants);
        const restaurantsMap: Record<number, Restaurant> = {};
        currentItinerary.restaurants.forEach((r: any) => {
          if (r.selectedRestaurant) {
            restaurantsMap[r.day] = r.selectedRestaurant;
          }
        });
        setSelectedRestaurants(restaurantsMap);
      }

      setLoading(false);
    } else {
      console.warn('⚠️  Store 中没有行程数据');
      message.error('未找到行程数据，请先规划行程');
      navigate('/plan');
    }
  }, [currentItinerary, navigate]);

  useEffect(() => {
    if (itineraryData) {
      generateSteps();
      loadIoTData();
      loadSpotImages(); // 加载景点图片
      // 异步加载餐厅和酒店推荐（不阻塞页面）
      loadRestaurantRecommendations();
      loadHotelRecommendations();
      // 计算初始实时预算
      calculateRealTimeBudgetData();
    }
  }, [itineraryData]);

  // 生成步骤列表
  const generateSteps = () => {
    if (!itineraryData) return;

    const newSteps: PlanningStep[] = [];

    // 按天交替：第1天景点 → 第1天餐厅 → 第2天景点 → 第2天餐厅 → ...
    itineraryData.itinerary.forEach((day) => {
      newSteps.push({
        type: 'attractions',
        day: day.day,
        label: `第${day.day}天景点`
      });
      newSteps.push({
        type: 'restaurants',
        day: day.day,
        label: `第${day.day}天餐厅`
      });
    });

    // 然后：酒店
    newSteps.push({
      type: 'hotels',
      label: '选择酒店'
    });

    // 最后：打包
    newSteps.push({
      type: 'packing',
      label: '行李打包'
    });

    setSteps(newSteps);
    setCompletedSteps(new Array(newSteps.length).fill(false));
  };

  // 加载IoT数据
  const loadIoTData = async () => {
    if (!itineraryData) return;

    try {
      const response = await getIoTData();
      if (response.success && response.data) {
        setIoTData(response.data.spots || []);
      }
    } catch (error) {
      console.error('加载IoT数据失败:', error);
    }
  };

  // 加载景点图片（批量获取）
  const loadSpotImages = async () => {
    if (!itineraryData) return;

    try {
      // 收集所有景点ID
      const spotIds: string[] = [];
      itineraryData.itinerary.forEach(day => {
        day.attractions.forEach(attraction => {
          if (attraction.id || attraction.spotId) {
            spotIds.push(attraction.id || attraction.spotId!);
          }
        });
      });

      if (spotIds.length === 0) {
        console.log('没有景点ID，跳过图片加载');
        return;
      }

      console.log(`📸 批量获取 ${spotIds.length} 个景点的图片`);
      const response = await batchGetSpotImagesByIds(spotIds);

      if (response.success && response.data) {
        setSpotImages(response.data.images);
        console.log(`✅ 成功加载 ${Object.keys(response.data.images).length} 个景点的图片`);
      }
    } catch (error) {
      console.error('批量获取景点图片失败:', error);
      // 失败不影响主流程，使用备用方案
      const fallbackImages: Record<string, string> = {};
      itineraryData.itinerary.forEach(day => {
        day.attractions.forEach(attraction => {
          if (attraction.id || attraction.spotId) {
            fallbackImages[attraction.id || attraction.spotId!] = '';
          }
        });
      });
      setSpotImages(fallbackImages);
    }
  };

  // 加载餐厅推荐
  const loadRestaurantRecommendations = async () => {
    if (!itineraryData) return;

    try {
      // 准备每天的景点数据
      const daysData = itineraryData.itinerary.map(day => ({
        day: day.day,
        date: day.date,
        spots: day.attractions.map(attraction => ({
          name: attraction.name,
          location: attraction.location
        }))
      }));

      console.log(`🍽️ 加载 ${daysData.length} 天的餐厅推荐`);
      const response = await getRestaurantRecommendations(daysData);

      if (response.success && response.data) {
        // 将餐厅推荐按天存储
        const restaurantsMap: Record<number, Restaurant[]> = {};
        response.data.forEach((dayRec: any) => {
          restaurantsMap[dayRec.day] = dayRec.restaurants;
        });

        setRestaurantRecommendations(restaurantsMap);
        console.log(`✅ 成功加载餐厅推荐`);
        
        // 不在这里设置showAllRestaurants，让它在步骤切换时动态控制
      }
    } catch (error) {
      console.error('加载餐厅推荐失败:', error);
    }
  };

  // 加载酒店推荐
  const loadHotelRecommendations = async () => {
    if (!itineraryData) return;

    try {
      // 收集所有景点
      const allSpots = itineraryData.itinerary.flatMap(day =>
        day.attractions.map(attraction => ({
          name: attraction.name,
          location: attraction.location
        }))
      );

      const budget = itineraryData.summary?.budget || 5000;

      console.log(`🏨 加载酒店推荐 - 景点数: ${allSpots.length}, 预算: ${budget}`);
      const response = await getHotelRecommendations(allSpots, budget);

      if (response.success && response.data) {
        setHotelRecommendations(response.data);
        console.log(`✅ 成功加载 ${response.data.length} 个酒店推荐`);
      }
    } catch (error) {
      console.error('加载酒店推荐失败:', error);
    }
  };

  // 计算实时预算
  const calculateRealTimeBudgetData = async () => {
    if (!itineraryData) return;

    try {
      const totalBudget = itineraryData.summary?.budget || 5000;
      const days = itineraryData.itinerary.length;

      // 准备景点数据
      const spots = itineraryData.itinerary.flatMap(day =>
        day.attractions.map(attraction => ({
          estimated_cost: attraction.estimated_cost
        }))
      );

      console.log('💰 计算实时预算');
      const response = await calculateRealTimeBudget({
        totalBudget,
        days,
        hotel: selectedHotel,
        restaurants: selectedRestaurants,
        spots
      });

      if (response.success && response.data) {
        setRealTimeBudget(response.data);
        console.log(`✅ 实时预算计算完成`, response.data);
      }
    } catch (error) {
      console.error('计算实时预算失败:', error);
    }
  };

  // 获取景点的IoT数据
  const getAttractionIoTData = (item: AttractionItem, allIoTData: any[]) => {
    return allIoTData.find(data => data.spotName === item.name);
  };

  // 处理卡片高度变化
  const handleCardHeightChange = (index: number, height: number) => {
    setCardHeights(prev => {
      const newHeights = [...prev];
      newHeights[index] = height;
      return newHeights;
    });
  };

  // 处理步骤变化
  const handleStepChange = (index: number) => {
    if (index <= currentStepIndex || completedSteps[index - 1]) {
      setCurrentStepIndex(index);

      // 根据步骤类型设置地图显示模式
      const step = steps[index];
      if (step.type === 'restaurants') {
        setShowAllRestaurants(true);
        setShowAllDays(false);
        console.log(`🍽️ 切换到餐厅选择模式 - 第${step.day}天`);
      } else if (step.type === 'hotels') {
        setShowAllRestaurants(false);
        setShowAllDays(true);
        console.log('🏨 切换到酒店选择模式');
      } else if (step.type === 'packing') {
        // 加载打包清单
        loadPackingItems();
        console.log('📦 切换到打包模式');
      } else {
        // 景点选择模式
        setShowAllRestaurants(false);
        setShowAllDays(false);
        console.log(`📍 切换到景点选择模式 - 第${step.day}天`);
      }
    }
  };

  // 加载打包清单
  const loadPackingItems = async () => {
    if (!tripId) return;

    try {
      const response = await getPackingList(tripId);
      if (response.success && response.data) {
        setPackingItems(response.data);
        console.log(`✅ 加载了 ${response.data.length} 个打包物品`);
      }
    } catch (error) {
      console.error('加载打包清单失败:', error);
    }
  };

  // 处理上一步
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // 处理下一步
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      // 标记当前步骤为完成
      setCompletedSteps(prev => {
        const newCompleted = [...prev];
        newCompleted[currentStepIndex] = true;
        return newCompleted;
      });

      // 进入下一步
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  // 处理保存行程
  const handleSave = async () => {
    if (!itineraryData) return;

    // 检查是否已经保存过
    if (tripId) {
      message.info('行程已保存，无需重复保存');
      return;
    }

    try {
      message.loading({ content: '正在保存行程...', key: 'save' });

      // 准备保存数据，参考后端tripController的实现
      const saveData = {
        summary: itineraryData.summary,
        itinerary: {
          itinerary: itineraryData.itinerary  // 后端期望的是 { itinerary: { itinerary: [] } }
        },
        total_cost: itineraryData.total_cost,
        budget_breakdown: itineraryData.budget_breakdown,
        hotel: selectedHotel,
        hotelRecommendations: hotelRecommendations, // 添加酒店推荐缓存
        restaurantRecommendations: Object.entries(restaurantRecommendations).map(([day, restaurants]) => ({
          day: parseInt(day),
          restaurants: restaurants
        })),
        restaurants: Object.entries(selectedRestaurants).map(([day, restaurant]) => ({
          day: parseInt(day),
          selectedRestaurant: restaurant
        })),
        // 添加个性化信息
        customization: {
          tripName: '',
          tripDescription: '',
          coverImage: ''
        }
      };

      console.log('📝 准备保存的行程数据:', JSON.stringify(saveData, null, 2));
      console.log('📝 restaurantRecommendations详情:', restaurantRecommendations);
      console.log('📝 hotelRecommendations详情:', hotelRecommendations);

      const response = await saveTrip(saveData);

      if (response.success) {
        const newTripId = response.data?.tripId;
        
        // 保存打包清单到新行程
        if (newTripId && packingItems.length > 0) {
          console.log('💾 保存打包清单到新行程:', { newTripId, itemCount: packingItems.length });
          try {
            await savePackingList(newTripId, packingItems);
            console.log('✅ 打包清单保存成功');
          } catch (error) {
            console.error('❌ 打包清单保存失败:', error);
          }
        }

        message.success({
          content: '行程保存成功！',
          key: 'save',
          duration: 2
        });

        // 更新行程数据，标记为已保存
        const updatedItinerary = {
          ...itineraryData,
          tripId: newTripId,
          isSavedTrip: true
        };
        setCurrentItinerary(updatedItinerary);

        // 跳转到我的行程页面
        setTimeout(() => {
          navigate('/my-trips');
        }, 500);
      } else {
        message.error({
          content: response.message || '保存失败，请重试',
          key: 'save'
        });
      }
    } catch (error: any) {
      console.error('保存行程失败:', error);
      message.error({
        content: error.response?.data?.error || error.message || '保存失败',
        key: 'save'
      });
    }
  };

  // 处理显示备选景点
  const handleShowAlternatives = async (item: AttractionItem, city?: string) => {
    console.log('🔍 查看备选景点:', item.name);
    console.log('   城市:', city || '未指定');

    const attractionKey = `${item.name}-${item.time}`;

    // 如果已经展开，则收起
    if (expandedAlternatives[attractionKey]) {
      handleCloseAlternatives(item);
      return;
    }

    setLoadingAlternatives(prev => ({ ...prev, [attractionKey]: true }));

    try {
      // 获取行程中所有景点的名称（用于排除）
      const allSpotNames = itineraryData!.itinerary.flatMap(day =>
        day.attractions.map(attr => attr.name)
      );

      console.log('   行程中的景点:', allSpotNames.join(', '));

      // 使用推荐服务获取备选景点
      const recommendations = await alternativeRecommender.getRecommendations(
        item,
        iotData,
        city,
        allSpotNames
      );

      console.log('✅ 获取到备选景点:', recommendations.length);

      setExpandedAlternatives(prev => ({
        ...prev,
        [attractionKey]: recommendations
      }));
    } catch (error: any) {
      console.error('❌ 获取备选景点失败:', error);
      message.error('获取备选景点失败，请稍后重试');
    } finally {
      setLoadingAlternatives(prev => ({ ...prev, [attractionKey]: false }));
    }
  };

  // 处理关闭备选景点
  const handleCloseAlternatives = (item: AttractionItem) => {
    const key = `${item.name}-${item.time}`;
    setExpandedAlternatives(prev => {
      const newAlternatives = { ...prev };
      delete newAlternatives[key];
      return newAlternatives;
    });
  };

  // 计算总景点数
  const calculateTotalAttractions = () => {
    if (!itineraryData) return 0;
    return itineraryData.itinerary.reduce((total, day) => total + day.attractions.length, 0);
  };

  // 获取当前步骤的天数
  const getCurrentDay = () => {
    const currentStep = steps[currentStepIndex];
    if (currentStep && currentStep.day) {
      return currentStep.day - 1;
    }
    return 0;
  };

  // 判断是否可以进入下一步
  const canProceed = () => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return false;

    // 景点步骤：至少有一个景点
    if (currentStep.type === 'attractions') {
      const dayIndex = currentStep.day ? currentStep.day - 1 : 0;
      return (itineraryData?.itinerary[dayIndex]?.attractions.length || 0) > 0;
    }

    // 餐厅步骤：允许跳过，始终可以进入下一步
    if (currentStep.type === 'restaurants') {
      return true;
    }

    // 酒店步骤：允许跳过，始终可以进入下一步
    if (currentStep.type === 'hotels') {
      return true;
    }

    return true;
  };

  if (loading) {
    return (
      <GlassLayout showSearch={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spin size="large" />
        </div>
      </GlassLayout>
    );
  }

  if (!itineraryData) {
    return (
      <GlassLayout showSearch={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">暂无行程数据</h2>
            <p className="text-white/60">请先在规划页面生成行程</p>
          </div>
        </div>
      </GlassLayout>
    );
  }

  const currentStep = steps[currentStepIndex];
  const currentDayIndex = getCurrentDay();
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <GlassLayout showSearch={false}>
      <div className="max-w-7xl mx-auto pb-20">
        {/* 页面标题 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-white">我的行程</h1>
            </div>
            <div className="flex items-center gap-2">
              {tripId && (
                <button
                  onClick={() => message.info('分享功能')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/15 transition-all duration-300"
                >
                  <Share2 className="w-4 h-4" />
                  <span>分享</span>
                </button>
              )}
            </div>
          </div>

          {/* 顶部摘要卡片组 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#FFD9A3] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">出行日期</p>
                <p className="text-lg font-bold text-white truncate">{itineraryData.summary?.start_date || '未设置'}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-[#FFD9A3] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">总预算</p>
                <p className="text-lg font-bold text-white truncate">¥{(itineraryData.summary?.budget || itineraryData.total_cost || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Cloud className="w-5 h-5 text-[#FFD9A3] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">目的地天气</p>
                <p className="text-lg font-bold text-white truncate">{itineraryData.summary?.destination || '未设置'}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#FFD9A3] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">行程总览</p>
                <p className="text-lg font-bold text-white truncate">{itineraryData.itinerary.length}天 · {calculateTotalAttractions()}景点</p>
              </div>
            </div>
          </div>
        </div>

        {/* 线性步骤导航 */}
        <LinearStepNavigation
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepChange={handleStepChange}
          completedSteps={completedSteps}
        />

        {/* 主内容区 - 根据当前步骤显示不同内容 */}
        {currentStep?.type === 'attractions' && (
          <div className="flex gap-4">
            {/* 左栏：时间轴和景点卡片整体部件 */}
            <div className="flex-1 min-w-0">
              {itineraryData.itinerary[currentDayIndex] && (
                <TimelineWithCards
                  attractions={itineraryData.itinerary[currentDayIndex].attractions}
                  city={itineraryData.summary?.destination}
                  iotData={iotData}
                  spotImages={spotImages} // 传入景点图片映射
                  onShowAlternatives={handleShowAlternatives}
                  expandedAlternatives={expandedAlternatives}
                  loadingAlternatives={loadingAlternatives}
                  handleCloseAlternatives={handleCloseAlternatives}
                  handleReplaceAttraction={(newItem: any, originalItem: any) => {
                    const newItinerary = { ...itineraryData };
                    newItinerary.itinerary[currentDayIndex].attractions = newItinerary.itinerary[currentDayIndex].attractions.map((attr: any, idx: number) => {
                      // 通过原始景点信息来找到要替换的景点
                      if (originalItem && (attr.name === originalItem.name && attr.time === originalItem.time)) {
                        return { ...newItem, time: attr.time }; // 保持原有的时间
                      }
                      return attr;
                    });
                    setItineraryData(newItinerary);
                    message.success(`已替换为 ${newItem.name}`);
                  }}
                  onAttractionsReorder={(newAttractions) => {
                    const newItinerary = { ...itineraryData };
                    newItinerary.itinerary[currentDayIndex].attractions = newAttractions;
                    setItineraryData(newItinerary);
                    message.success('行程顺序已调整');
                  }}
                />
              )}
            </div>

            {/* 右栏：可全屏地图 + 预算分布 */}
            <div className="w-[40%] flex-shrink-0 space-y-4 sticky top-4 h-fit">
              {/* 可全屏地图 - 默认更小 */}
              <FullscreenMap
                title={`${itineraryData.itinerary[currentDayIndex]?.date || ''} · 路线地图`}
                defaultHeight="h-48"
                fullscreenHeight="h-[600px]"
                defaultWidth="w-full"
                fullscreenWidth="w-full"
              >
                {itineraryData.itinerary[currentDayIndex] && (
                  <DayMapComponent
                    day={itineraryData.itinerary[currentDayIndex]}
                    hotel={(currentStep?.type as string) === 'hotels' ? selectedHotel : null}
                    restaurant={(currentStep?.type as string) === 'restaurants' ? selectedRestaurants[itineraryData.itinerary[currentDayIndex].day] : null}
                    showAllRestaurants={showAllRestaurants}
                    showAllDays={showAllDays}
                    allDays={itineraryData.itinerary}
                    restaurantRecommendations={restaurantRecommendations[itineraryData.itinerary[currentDayIndex].day]}
                    hotelRecommendations={(currentStep?.type as string) === 'hotels' ? hotelRecommendations : []}
                  />
                )}
              </FullscreenMap>

              {/* 改进的预算分布 */}
              <BudgetBar
                categories={[
                  { name: '交通', amount: realTimeBudget?.transportation || itineraryData.budget_breakdown.transportation, color: 'bg-blue-500' },
                  { name: '住宿', amount: realTimeBudget?.accommodation || itineraryData.budget_breakdown.accommodation, color: 'bg-purple-500' },
                  { name: '餐饮', amount: realTimeBudget?.dining || itineraryData.budget_breakdown.dining, color: 'bg-amber-500' },
                  { name: '门票', amount: realTimeBudget?.tickets || itineraryData.budget_breakdown.tickets, color: 'bg-green-500' },
                ]}
                totalBudget={itineraryData.summary?.budget || 5000}
                usedBudget={realTimeBudget?.total || itineraryData.total_cost || 0}
              />

              {/* 行李清单 */}
              {tripId && (
                <PackingListWidget 
                  itineraryId={tripId}
                  editable={true}
                  title="行李清单"
                />
              )}
            </div>
          </div>
        )}

        {currentStep?.type === 'restaurants' && (
          <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 border border-white/30 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">第{currentStep.day}天 · 餐厅选择</h2>
              <p className="text-white/60">
                基于当天行程景点位置推荐的餐厅
                {restaurantRecommendations[currentStep.day || 0]?.length > 0 &&
                  ` · 共找到 ${restaurantRecommendations[currentStep.day || 0].length} 家餐厅`
                }
              </p>
            </div>
              
            {restaurantRecommendations[currentStep.day || 0]?.length > 0 ? (
              <div className="grid grid-cols-2 gap-6">
                {/* 左侧：餐厅列表 */}
                <div className="space-y-4">
                  {restaurantRecommendations[currentStep.day || 0].map((restaurant, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedRestaurants(prev => ({
                          ...prev,
                          [currentStep.day || 0]: restaurant
                        }));
                        setShowAllRestaurants(false); // 选择后关闭显示所有餐厅
                        message.success(`已选择 ${restaurant.name}`);
                        // 重新计算实时预算
                        calculateRealTimeBudgetData();
                      }}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        selectedRestaurants[currentStep.day || 0]?.name === restaurant.name
                          ? 'bg-green-500/20 border-green-400/50 text-green-400'
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      }`}
                    >
                      <div className="font-semibold text-lg mb-1">{restaurant.name}</div>
                      <div className="text-sm text-white/60 mb-1">{restaurant.type || '餐厅'}</div>
                      <div className="flex items-center justify-between text-xs">
                        {restaurant.rating && (
                          <span className="text-amber-400">⭐ {restaurant.rating.toFixed(1)}</span>
                        )}
                        {restaurant.distance && (
                          <span className="text-white/40">{restaurant.distance}m</span>
                        )}
                      </div>
                      {restaurant.address && (
                        <div className="text-xs text-white/40 mt-1 truncate">{restaurant.address}</div>
                      )}
                    </button>
                  ))}
                </div>

                {/* 右侧：地图 */}
                <div className="bg-white/20 rounded-xl overflow-hidden h-[500px]">
                  {currentStep.day && itineraryData.itinerary[currentStep.day - 1] && (
                    <DayMapComponent
                    day={itineraryData.itinerary[currentStep.day - 1]}
                      hotel={null}
                      restaurant={selectedRestaurants[currentStep.day || 0] || null}
                      showAllRestaurants={true}
                      showAllDays={false}
                      allDays={[]}
                      restaurantRecommendations={restaurantRecommendations[currentStep.day || 0]}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-white/60 py-8">
                <div className="mb-4">正在加载餐厅推荐...</div>
                <div className="text-sm text-white/40">系统会根据当天行程景点的位置智能推荐周边餐厅</div>
              </div>
            )}
          </div>
        )}

        {currentStep?.type === 'hotels' && (
          <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 border border-white/30 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">选择酒店</h2>
              <p className="text-white/60">
                基于所有行程景点位置推荐的酒店
                {hotelRecommendations?.length > 0 &&
                  ` · 共找到 ${hotelRecommendations.length} 家酒店`
                }
              </p>
            </div>
              
            {hotelRecommendations?.length > 0 ? (
              <div className="grid grid-cols-2 gap-6">
                {/* 左侧：酒店列表 */}
                <div className="space-y-4">
                  {hotelRecommendations.map((hotel, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedHotel(hotel);
                        setShowAllDays(true); // 确定酒店后显示所有天数路线
                        message.success(`已选择 ${hotel.name}`);
                        // 重新计算实时预算
                        calculateRealTimeBudgetData();
                      }}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        selectedHotel?.name === hotel.name
                          ? 'bg-green-500/20 border-green-400/50 text-green-400'
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      }`}
                    >
                      <div className="font-semibold text-lg mb-1">{hotel.name}</div>
                      <div className="text-sm text-white/60 mb-1">{hotel.type || '酒店'}</div>
                      <div className="flex items-center justify-between text-xs">
                        {hotel.rating && (
                          <span className="text-amber-400">⭐ {hotel.rating.toFixed(1)}</span>
                        )}
                        {hotel.avgDistance && (
                          <span className="text-white/40">距景点 {hotel.avgDistance.toFixed(1)}km</span>
                        )}
                      </div>
                      {hotel.address && (
                        <div className="text-xs text-white/40 mt-1 truncate">{hotel.address}</div>
                      )}
                    </button>
                  ))}
                </div>

                {/* 右侧：地图 */}
                <div className="bg-white/20 rounded-xl overflow-hidden h-[500px]">
                  {itineraryData.itinerary.length > 0 && (
                    <DayMapComponent
                    day={null}
                      hotel={selectedHotel || null}
                      restaurant={null}
                      showAllRestaurants={false}
                      showAllDays={true}
                      allDays={itineraryData.itinerary}
                      restaurantRecommendations={[]}
                      hotelRecommendations={hotelRecommendations}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-white/60 py-8">
                <div className="mb-4">正在加载酒店推荐...</div>
                <div className="text-sm text-white/40">系统会根据所有行程景点的位置智能推荐周边酒店</div>
              </div>
            )}
          </div>
        )}

        {currentStep?.type === 'packing' && (
          <PackingStep
            tripId={tripId || ''}
            initialItems={packingItems}
            onSave={async (items) => {
              setPackingItems(items);
              // 如果有tripId，保存到数据库
              if (tripId) {
                try {
                  // 批量保存打包物品
                  for (const item of items) {
                    if (!item.id) {
                      // 新物品，添加
                      await addPackingItem(
                        tripId,
                        item.itemName,
                        item.category
                      );
                    } else {
                      // 已有物品，更新状态
                      await updatePackingItem(item.id, {
                        isPacked: item.isPacked
                      });
                    }
                  }
                  console.log('✅ 打包清单已保存到数据库');
                } catch (error) {
                  console.error('保存打包清单失败:', error);
                  message.error('保存失败，请重试');
                }
              }
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}
      </div>

      {/* 固定右下角操作按钮 */}
      <ActionButton
        isLastStep={isLastStep}
        isFirstStep={isFirstStep}
        canProceed={canProceed()}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSave={handleSave}
      />
    </GlassLayout>
  );
}











