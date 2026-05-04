// 行程详情页面 - 优化版UI设计（参考ItineraryOptimized风格）
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message, Spin } from 'antd';
import {
  MapPin,
  Calendar,
  Wallet,
  Cloud,
  Share2,
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  Camera,
  PenLine,
  CheckCircle,
} from 'lucide-react';
import GlassLayout from '../components/layout/GlassLayout';
import TimelineWithCards from '../components/itinerary/TimelineWithCards';
import LinearStepNavigation, { PlanningStep } from '../components/itinerary/LinearStepNavigation';
import FullscreenMap from '../components/itinerary/FullscreenMap';
import BudgetBar from '../components/itinerary/BudgetBar';
import ActionButton from '../components/itinerary/ActionButton';
import DayMap from '../components/itinerary/DayMap';
import {
  getTripById,
  completeTrip,
  spotIot,
  updateAlternativeRelations,
  batchgetSpotImgsByIds,
} from '../api/client';
import { FullItinerary, AttractionItem } from '../api/client';
import { alternativeRecommender } from '../services/alternativeRecommender';
import ShareButton from '../components/common/ShareButton';
import SpotImageUploadModal from '../components/spot/SpotImageUploadModal';
import PackingListDrawer from '../components/trip/PackingListDrawer';
import { PackingListWidget } from '../components/itinerary/PackingListWidget';
import SimpleBudgetAdjustModal from '../components/budget/SimpleBudgetAdjustModal';
import ExpenseRecordModal from '../components/budget/ExpenseRecordModal';
import BudgetWidget from '../components/budget/BudgetWidget';

// 辅助函数
const formatShortDate = (date: string) => {
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

const calculateDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

// 数据库格式转换为前端格式
function convertDbToItinerary(trip: any): FullItinerary {
  const itinerary = trip.days.map((day: any) => ({
    day: day.dayNumber,
    date: new Date(day.date).toISOString().split('T')[0],
    attractions: day.itineraryItems.map((item: any) => {
      const startDateTime = new Date(item.startTime);
      const endDateTime = new Date(item.endTime);
      const startTime = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`;
      const endTime = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;

      return {
        spotId: item.spotId, // 景点唯一标识
        name: item.name,
        time: `${startTime}-${endTime}`,
        location: item.longitude && item.latitude ? `${item.longitude},${item.latitude}` : '',
        estimated_cost: item.cost || 0,
        description: item.description || item.type || '',
        type: item.type || '景点',
        address: item.address || '',
      };
    }),
    daily_cost: day.itineraryItems.reduce((sum: number, item: any) => sum + item.cost, 0),
  }));

  return {
    itinerary,
    // 计算实际花费（Budget表中的数据）
    total_cost: trip.budget
      ? trip.budget.transportation +
        trip.budget.accommodation +
        trip.budget.food +
        trip.budget.tickets +
        trip.budget.shopping +
        trip.budget.other
      : 0,
    budget_breakdown: {
      transportation: trip.budget?.transportation || 0,
      accommodation: trip.budget?.accommodation || 0,
      dining: trip.budget?.food || 0,
      tickets: trip.budget?.tickets || 0,
    },
    summary: {
      destination: trip.destination,
      start_date: new Date(trip.startDate).toISOString().split('T')[0],
      end_date: new Date(trip.endDate).toISOString().split('T')[0],
      budget: trip.totalBudget || 0,
      days: itinerary.length,
    },
    alternativePools: trip.alternativePools || {}, // ✅ 添加备选景点池
  };
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [trip, setTrip] = useState<any>(null);
  const [itineraryData, setItineraryData] = useState<FullItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripStatus, setTripStatus] = useState<'planning' | 'completed'>('planning');
  const [completing, setCompleting] = useState(false);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, any[]>>({});
  const [loadingAlternatives, setLoadingAlternatives] = useState<Record<string, boolean>>({});
  const [iotData, setIoTData] = useState<any[]>([]);
  const [spotImages, setSpotImages] = useState<Record<string, string>>({});

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [packingListVisible, setPackingListVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<AttractionItem | null>(null);

  // 预算调整弹窗
  const [budgetAdjustVisible, setBudgetAdjustVisible] = useState(false);

  // 开支记录弹窗（记账本）
  const [expenseRecordVisible, setExpenseRecordVisible] = useState(false);

  // 步骤导航状态
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [steps, setSteps] = useState<PlanningStep[]>([]);

  useEffect(() => {
    if (id) {
      loadTripDetail(id);
    }
  }, [id]);

  const loadTripDetail = async (tripId: string) => {
    setLoading(true);
    try {
      const response = await getTripById(tripId);
      if (response.success && response.data) {
        const tripData = response.data;
        setTrip(tripData);
        const convertedItinerary = convertDbToItinerary(tripData);
        setItineraryData(convertedItinerary);
        setTripStatus(tripData.status);
        console.log('✅ 行程详情加载成功:', tripData);
        loadIoTData();
        // 直接使用转换后的数据加载图片，而不是依赖状态
        loadSpotImagesForItinerary(convertedItinerary);
      } else {
        console.error('加载行程失败');
        message.error('加载行程失败');
      }
    } catch (error) {
      console.error('加载行程失败:', error);
      message.error('加载行程失败');
    } finally {
      setLoading(false);
    }
  };

  const loadIoTData = async () => {
    try {
      const response = await spotIot();
      if (response.success && response.data) {
        setIoTData(response.data.spots);
      }
    } catch (error) {
      console.error('加载IoT数据失败:', error);
    }
  };

  const loadSpotImages = async () => {
    if (!itineraryData) return;

    try {
      const spotIds: string[] = [];
      itineraryData.itinerary.forEach((day) => {
        day.attractions.forEach((attraction) => {
          if (attraction.spotId) {
            spotIds.push(attraction.spotId);
          }
        });
      });

      if (spotIds.length === 0) {
        console.log('没有景点ID，跳过图片加载');
        return;
      }

      console.log(`📸 批量获取 ${spotIds.length} 个景点的图片`);
      const response = await batchgetSpotImgsByIds(spotIds);

      if (response.success && response.data) {
        setSpotImages(response.data.images);
        console.log(`✅ 成功加载 ${Object.keys(response.data.images).length} 个景点的图片`);
      }
    } catch (error) {
      console.error('批量获取景点图片失败:', error);
    }
  };

  // 直接根据行程数据加载图片（不依赖状态）
  const loadSpotImagesForItinerary = async (itinerary: FullItinerary) => {
    try {
      const spotIds: string[] = [];
      itinerary.itinerary.forEach((day) => {
        day.attractions.forEach((attraction) => {
          if (attraction.spotId) {
            spotIds.push(attraction.spotId);
          }
        });
      });

      if (spotIds.length === 0) {
        console.log('⚠️ 没有景点ID，跳过图片加载');
        console.log('行程数据:', itinerary);
        return;
      }

      console.log(`📸 批量获取 ${spotIds.length} 个景点的图片`);
      console.log('景点ID列表:', spotIds);
      const response = await batchgetSpotImgsByIds(spotIds);

      if (response.success && response.data) {
        console.log(`✅ 成功加载 ${Object.keys(response.data.images).length} 个景点的图片`);
        console.log('图片数据:', response.data.images);
        setSpotImages(response.data.images);
      } else {
        console.log('❌ 图片加载失败:', response);
      }
    } catch (error) {
      console.error('批量获取景点图片失败:', error);
    }
  };

  // 生成步骤列表
  const generateSteps = () => {
    if (!itineraryData) return;

    const newSteps: PlanningStep[] = [];

    // 按天交替：第1天景点 → 第2天景点 → ... → 酒店信息
    itineraryData.itinerary.forEach((day) => {
      newSteps.push({
        type: 'attractions',
        day: day.day,
        label: `第${day.day}天景点`,
      });
    });

    setSteps(newSteps);
    setCompletedSteps(new Array(newSteps.length).fill(false));
  };

  useEffect(() => {
    if (itineraryData) {
      generateSteps();
    }
  }, [itineraryData]);

  // 处理步骤变化
  const handleStepChange = (index: number) => {
    if (index <= currentStepIndex || completedSteps[index - 1]) {
      setCurrentStepIndex(index);
    }
  };

  // 处理上一步
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // 处理下一步
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCompletedSteps((prev) => {
        const newCompleted = [...prev];
        newCompleted[currentStepIndex] = true;
        return newCompleted;
      });
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  // 处理显示备选景点（新方案：从行程数据中获取）
  const handleShowAlternatives = async (item: AttractionItem, city?: string) => {
    console.log('🔍 查看备选景点:', item.name);
    console.log('   城市:', city || '未指定');

    const attractionKey = `${item.name}-${item.time}`;

    if (expandedAlternatives[attractionKey]) {
      handleCloseAlternatives(item);
      return;
    }

    setLoadingAlternatives((prev) => ({ ...prev, [attractionKey]: true }));

    try {
      // 新方案：从行程数据的alternativePools中获取备选景点
      const spotId = item.spotId || item.id;

      if (!itineraryData?.alternativePools || !spotId) {
        console.warn('⚠️  没有备选景点数据');
        message.info('暂无备选景点');
        setLoadingAlternatives((prev) => ({ ...prev, [attractionKey]: false }));
        return;
      }

      // 从alternativePools获取备选景点
      const alternatives = itineraryData.alternativePools[spotId] || [];

      console.log(`✅ 从行程数据获取到 ${alternatives.length} 个备选景点`);

      // 调试：打印备选景点数据结构
      if (alternatives.length > 0) {
        console.log('📦 备选景点数据示例:', {
          name: alternatives[0].name,
          image: alternatives[0].image,
          iotData: alternatives[0].iotData,
          rating: alternatives[0].rating,
          estimated_cost: alternatives[0].estimated_cost,
        });
      }

      if (alternatives.length === 0) {
        message.info('暂无备选景点');
      }

      setExpandedAlternatives((prev) => ({
        ...prev,
        [attractionKey]: alternatives,
      }));
    } catch (error: any) {
      console.error('❌ 获取备选景点失败:', error);
      message.error('获取备选景点失败，请稍后重试');
    } finally {
      setLoadingAlternatives((prev) => ({ ...prev, [attractionKey]: false }));
    }
  };

  const handleCloseAlternatives = (item: AttractionItem) => {
    const key = `${item.name}-${item.time}`;
    setExpandedAlternatives((prev) => {
      const newAlternatives = { ...prev };
      delete newAlternatives[key];
      return newAlternatives;
    });
  };

  const handleReplaceAttraction = async (newItem: any, originalItem: any) => {
    const currentDayIndex = currentStepIndex;
    if (!itineraryData) return;

    const newItinerary = { ...itineraryData };
    newItinerary.itinerary[currentDayIndex].attractions = newItinerary.itinerary[
      currentDayIndex
    ].attractions.map((attr: any, idx: number) => {
      if (originalItem && attr.name === originalItem.name && attr.time === originalItem.time) {
        // 替换景点，保留原时间，更新spotId和图片信息
        return {
          ...newItem,
          time: attr.time,
          spotId: newItem.id, // 更新spotId
          image: newItem.image, // 确保图片字段存在
        };
      }
      return attr;
    });
    setItineraryData(newItinerary);

    // 重新加载图片映射，包含新景点的图片
    await loadSpotImagesForItinerary(newItinerary);

    message.success(`已替换为 ${newItem.name}`);
  };

  const handleAttractionsReorder = (newAttractions: AttractionItem[]) => {
    const currentDayIndex = currentStepIndex;
    if (!itineraryData) return;

    const newItinerary = { ...itineraryData };
    newItinerary.itinerary[currentDayIndex].attractions = newAttractions;
    setItineraryData(newItinerary);
    message.success('行程顺序已调整');
  };

  const handleCompleteTrip = async () => {
    if (!id) return;

    setCompleting(true);
    try {
      const response = await completeTrip(id);
      if (response.success) {
        setTripStatus('completed');
        message.success('行程已完成！');
      }
    } catch (error: any) {
      console.error('完成行程失败:', error);
      message.error('完成行程失败');
    } finally {
      setCompleting(false);
    }
  };

  const handleOpenUploadModal = (spot: AttractionItem) => {
    setSelectedSpot(spot);
    setUploadModalVisible(true);
  };

  // 获取当前步骤的天数
  const getCurrentDay = () => {
    const currentStep = steps[currentStepIndex];
    if (currentStep && currentStep.day) {
      return currentStep.day - 1;
    }
    return 0;
  };

  // 计算总景点数
  const calculateTotalAttractions = () => {
    if (!itineraryData) return 0;
    return itineraryData.itinerary.reduce((total, day) => total + day.attractions.length, 0);
  };

  // 判断是否可以进入下一步
  const canProceed = () => {
    return true; // 行程详情页面总是可以进入下一步
  };

  const currentStep = steps[currentStepIndex];
  const currentDayIndex = getCurrentDay();
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  if (loading) {
    return (
      <GlassLayout showSearch={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spin size="large" />
        </div>
      </GlassLayout>
    );
  }

  if (!trip || !itineraryData) {
    return (
      <GlassLayout showSearch={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">行程不存在</h2>
            <p className="text-white/60 mb-4">请返回我的行程页面</p>
            <button
              onClick={() => navigate('/my-trips')}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors"
            >
              返回我的行程
            </button>
          </div>
        </div>
      </GlassLayout>
    );
  }

  const hotel = trip.hotelName
    ? {
        name: trip.hotelName,
        address: trip.hotelAddress,
        location: trip.hotelLocation,
        type: trip.hotelType,
        rating: trip.hotelRating,
        avgDistance: 0,
        distanceDetails: [],
      }
    : null;

  const getRestaurantForDay = (dayNumber: number) => {
    const day = trip.days?.find((d: any) => d.dayNumber === dayNumber);
    if (day?.restaurantName) {
      return {
        name: day.restaurantName,
        address: day.restaurantAddress,
        location: day.restaurantLocation,
        type: day.restaurantType,
        rating: day.restaurantRating,
        distance: 0,
      };
    }
    return null;
  };

  return (
    <GlassLayout showSearch={false}>
      <div className="max-w-7xl mx-auto pb-20">
        {/* 封面图片 */}
        {trip.coverImage && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <img src={trip.coverImage} alt={trip.title} className="w-full h-64 object-cover" />
          </div>
        )}

        {/* 页面标题 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-white">{trip.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  tripStatus === 'completed'
                    ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                }`}
              >
                {tripStatus === 'completed' ? '已完成' : '规划中'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {id && (
                <ShareButton tripId={id} style={{ height: 40, fontSize: 15, paddingInline: 20 }} />
              )}
            </div>
          </div>

          {/* 顶部摘要卡片组 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">出行日期</p>
                <p className="text-lg font-bold text-white truncate">
                  {itineraryData.summary?.start_date || '未设置'}
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">总预算</p>
                <p className="text-lg font-bold text-white truncate">
                  ¥
                  {(
                    itineraryData.summary?.budget ||
                    itineraryData.total_cost ||
                    0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Cloud className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">目的地</p>
                <p className="text-lg font-bold text-white truncate">
                  {itineraryData.summary?.destination || '未设置'}
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">行程总览</p>
                <p className="text-lg font-bold text-white truncate">
                  {itineraryData.itinerary.length}天 · {calculateTotalAttractions()}景点
                </p>
              </div>
            </div>
          </div>

          {/* 行程描述 */}
          {trip.description && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6">
              <p className="text-white/80">{trip.description}</p>
            </div>
          )}
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
                  spotImages={spotImages}
                  onShowAlternatives={handleShowAlternatives}
                  expandedAlternatives={expandedAlternatives}
                  loadingAlternatives={loadingAlternatives}
                  handleCloseAlternatives={handleCloseAlternatives}
                  handleReplaceAttraction={handleReplaceAttraction}
                  onAttractionsReorder={handleAttractionsReorder}
                />
              )}

              {/* 餐厅信息 */}
              {(() => {
                const restaurant = getRestaurantForDay(
                  itineraryData.itinerary[currentDayIndex].day
                );
                return (
                  restaurant && (
                    <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🍽️</span>
                        <h3 className="text-sm font-semibold text-white">午餐餐厅</h3>
                      </div>
                      <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-white mb-1">{restaurant.name}</h4>
                        {restaurant.address && (
                          <p className="text-xs text-white/60">📍 {restaurant.address}</p>
                        )}
                        {restaurant.rating && (
                          <div className="text-xs text-amber-400 mt-1">⭐ {restaurant.rating}</div>
                        )}
                      </div>
                    </div>
                  )
                );
              })()}
            </div>

            {/* 右栏：可全屏地图 + 预算分布 */}
            <div className="w-[40%] flex-shrink-0 space-y-4 sticky top-4 h-fit">
              {/* 可全屏地图 */}
              <FullscreenMap
                title={`${itineraryData.itinerary[currentDayIndex]?.date || ''} · 路线地图`}
                defaultHeight="h-48"
                fullscreenHeight="h-[600px]"
                defaultWidth="w-full"
                fullscreenWidth="w-full"
              >
                {itineraryData.itinerary[currentDayIndex] && (
                  <DayMap
                    day={itineraryData.itinerary[currentDayIndex]}
                    hotel={hotel}
                    restaurant={getRestaurantForDay(itineraryData.itinerary[currentDayIndex].day)}
                    showAllRestaurants={false}
                    showAllDays={false}
                    allDays={[]}
                    restaurantRecommendations={[]}
                    hotelRecommendations={[]}
                  />
                )}
              </FullscreenMap>

              {/* 预算管理 */}
              <BudgetWidget
                tripId={id || ''}
                totalBudget={trip?.totalBudget || 0}
                budget={trip?.budget}
                onRecordExpense={() => setExpenseRecordVisible(true)}
                onmodBudget={() => setBudgetAdjustVisible(true)}
              />

              {/* 行李清单 */}
              {id && <PackingListWidget itineraryId={id} editable={true} title="行李清单" />}
            </div>
          </div>
        )}
      </div>

      {/* 固定右下角操作按钮 */}
      <ActionButton
        isLastStep={isLastStep}
        isFirstStep={isFirstStep}
        canProceed={canProceed()}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSave={() => {
          if (tripStatus === 'planning') {
            handleCompleteTrip();
          } else {
            navigate('/blog/create');
          }
        }}
        saveButtonText={tripStatus === 'planning' ? '完成行程' : '写游记'}
      />

      {/* Upload Modal */}
      <SpotImageUploadModal
        visible={uploadModalVisible}
        spot={selectedSpot}
        tripId={id || ''}
        city={itineraryData.summary?.destination || ''}
        onClose={() => {
          setUploadModalVisible(false);
          setSelectedSpot(null);
        }}
        onSuccess={() => {
          console.log('图片上传成功，等待审核');
        }}
      />

      {/* Packing List Drawer */}
      <PackingListDrawer
        visible={packingListVisible}
        onClose={() => setPackingListVisible(false)}
        tripId={id || ''}
      />

      {/* 预算调整弹窗 */}
      {id && (
        <SimpleBudgetAdjustModal
          visible={budgetAdjustVisible}
          tripId={id}
          currentBudget={trip?.totalBudget || 0}
          onClose={() => setBudgetAdjustVisible(false)}
          onUpdate={() => {
            // 预算调整后重新加载行程数据
            loadTripDetail(id);
          }}
        />
      )}

      {/* 开支记录弹窗（记账本） */}
      {id && (
        <ExpenseRecordModal
          visible={expenseRecordVisible}
          tripId={id}
          onClose={() => setExpenseRecordVisible(false)}
          onUpdate={async () => {
            // 开支记录后重新加载行程数据以更新预算显示
            try {
              const response = await getTripById(id);
              if (response.success && response.data) {
                setTrip(response.data);
                const converted = convertDbToItinerary(response.data);
                setItineraryData(converted);
              }
            } catch (error) {
              console.error('重新加载行程数据失败:', error);
            }
          }}
        />
      )}
    </GlassLayout>
  );
}
