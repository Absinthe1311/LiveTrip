// Homepage数据管理Hook - 统一管理首页所有数据获取
import { useState, useEffect } from 'react';
import {
  getUserTrips,
  getPackingList,
  getPackingProgress,
  getIoTData,
  apiClient,
} from '../api/client';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '../utils/cacheManager';

// 类型定义
interface PackingItem {
  id: string;
  name: string;
  packed: boolean;
  category: string;
}

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  icon?: string;
}

interface BudgetData {
  transportation: number;
  accommodation: number;
  food: number;
  tickets: number;
  shopping: number;
  other: number;
  total: number;
}

interface TripStats {
  totalTrips: number;
  totalCities: number;
  completedTrips: number;
  upcomingTrips: number;
}

interface UpcomingTrip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
}

interface TripDate {
  startDate: Date;
  endDate: Date;
  tripId: string;
  tripTitle: string;
}

interface FootprintCity {
  name: string;
  location: string;
  tripCount: number;
  tripIds: string[];
}

interface HotDestination {
  city: string;
  spotCount: number;
  coverImage?: string;
  description?: string;
}

interface SearchResult {
  type: 'destination' | 'trip' | 'blog';
  id: string;
  title: string;
  subtitle: string;
  image?: string;
}

export const useHomepageData = () => {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 行李清单
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [packingProgress, setPackingProgress] = useState(0);

  // 天气数据
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('北京'); // 默认北京
  const [destinationCities, setDestinationCities] = useState<string[]>([]); // 用户的目的地城市列表

  // 预算数据
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);

  // 行程统计
  const [tripStats, setTripStats] = useState<TripStats>({
    totalTrips: 0,
    totalCities: 0,
    completedTrips: 0,
    upcomingTrips: 0,
  });

  // 即将出行的行程
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);

  // 行程日期（用于日历）
  const [tripDates, setTripDates] = useState<TripDate[]>([]);

  // 当前行程ID
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);

  // 足迹城市（新增）
  const [footprintCities, setFootprintCities] = useState<FootprintCity[]>([]);

  // 热门目的地（新增）
  const [hotDestinations, setHotDestinations] = useState<HotDestination[]>([]);

  // 搜索结果（新增）
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // 获取用户行程列表
  const fetchUserTrips = async () => {
    try {
      // 使用缓存获取行程数据
      const response = await cacheManager.getOrSet(
        CACHE_KEYS.USER_TRIPS,
        async () => {
          const res = await getUserTrips();
          return res;
        },
        CACHE_TTL.MEDIUM // 5分钟缓存
      );
      
      console.log('getUserTrips response:', response);
      
      // 后端返回格式: { success: true, data: Trip[] }
      if (response.success && Array.isArray(response.data)) {
        const trips = response.data;
        console.log('获取到的行程列表:', trips);
        
        // 计算统计数据
        const totalTrips = trips.length;
        const completedTrips = trips.filter((trip: any) => trip.status === 'completed').length;
        const upcomingTripsCount = trips.filter((trip: any) => {
          const startDate = new Date(trip.startDate);
          return startDate > new Date();
        }).length;

        // 统计去过的城市
        const citiesSet = new Set<string>();
        trips.forEach((trip: any) => {
          if (trip.destination) {
            citiesSet.add(trip.destination);
          }
        });

        setTripStats({
          totalTrips,
          totalCities: citiesSet.size,
          completedTrips,
          upcomingTrips: upcomingTripsCount,
        });

        // 获取即将出行的行程（未来3个）
        const upcoming = trips
          .filter((trip: any) => {
            const startDate = new Date(trip.startDate);
            const now = new Date();
            const isUpcoming = startDate > now;
            console.log(`行程 ${trip.title} (${trip.destination}): 开始日期 ${trip.startDate}, 是否即将出行: ${isUpcoming}`);
            return isUpcoming;
          })
          .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 3)
          .map((trip: any) => ({
            id: trip.id,
            title: trip.title,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            days: Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
          }));

        console.log('即将出行的行程数量:', upcoming.length);
        console.log('即将出行的行程列表:', upcoming);
        setUpcomingTrips(upcoming);

        // 获取行程日期（用于日历高亮）
        const dates = trips.map((trip: any) => ({
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          tripId: trip.id,
          tripTitle: trip.title,
        }));
        setTripDates(dates);

        // 设置当前行程（最近的行程，按开始日期排序）
        const sortedTrips = [...trips].sort((a: any, b: any) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        
        // 优先选择即将出行的行程，如果没有则选择最近的行程
        const upcomingTrip = sortedTrips.find((trip: any) => {
          const startDate = new Date(trip.startDate);
          return startDate >= new Date();
        });
        
        const currentTrip = upcomingTrip || sortedTrips[0];
        console.log('当前行程:', currentTrip);
        
        if (currentTrip) {
          setCurrentTripId(currentTrip.id);
        }

        return { trips, currentTrip };
      } else {
        console.log('响应格式不正确或没有行程数据');
        return { trips: [], currentTrip: null };
      }
    } catch (err) {
      console.error('获取行程列表失败:', err);
    }
  };

  // 获取行李清单
  const fetchPackingList = async (tripId: string) => {
    try {
      console.log('🔄 开始获取行李清单, tripId:', tripId);
      const response = await getPackingList(tripId);
      console.log('📦 行李清单API响应:', response);
      
      if (response.success && response.data) {
        const items = response.data.map((item: any) => ({
          id: item.id,
          name: item.itemName,
          packed: item.isPacked,
          category: item.category,
        }));
        console.log('✅ 解析后的行李清单:', items);
        setPackingItems(items);
      } else {
        console.log('⚠️ 行李清单为空');
        setPackingItems([]);
      }
    } catch (err) {
      console.error('❌ 获取行李清单失败:', err);
      setPackingItems([]);
    }
  };

  // 获取打包进度
  const fetchPackingProgress = async (tripId: string) => {
    try {
      const response = await getPackingProgress(tripId);
      if (response.data.success) {
        setPackingProgress(response.data.progress);
      }
    } catch (err) {
      console.error('获取打包进度失败:', err);
    }
  };

  // 获取天气数据 - 从IoT数据中获取指定城市的天气
  const fetchWeatherData = async (city: string) => {
    try {
      // 使用缓存获取天气数据
      const cacheKey = CACHE_KEYS.WEATHER_DATA(city);
      
      const weatherResult = await cacheManager.getOrSet(
        cacheKey,
        async () => {
          // 1. 获取该城市的景点（取第一个景点）
          const spotsResponse = await apiClient.get(`/destinations/cities/${encodeURIComponent(city)}/spots`, {
            params: { limit: 1 }
          });

          if (spotsResponse.data.success && spotsResponse.data.data.length > 0) {
            const spot = spotsResponse.data.data[0];

            // 2. 获取IoT数据（包含天气）
            const iotResponse = await getIoTData();
            if (iotResponse.success && iotResponse.data.spots) {
              // 查找该景点的IoT数据
              const spotIoT = iotResponse.data.spots.find(
                (s: any) => s.id === spot.id || s.name.includes(spot.name)
              );

              if (spotIoT) {
                return {
                  city: city,
                  temperature: Math.round(spotIoT.temperature || 20),
                  condition: spotIoT.weatherDescription || '晴',
                  humidity: spotIoT.humidity || 50,
                  windSpeed: 10, // IoT数据中没有风速
                  pressure: 1013, // IoT数据中没有气压
                  icon: spotIoT.weatherIcon,
                };
              }
            }
          }

          // 降级：使用默认天气数据
          return {
            city: city,
            temperature: 20,
            condition: '晴',
            humidity: 50,
            windSpeed: 10,
            pressure: 1013,
          };
        },
        CACHE_TTL.SHORT // 1分钟缓存（天气数据更新较快）
      );

      setWeatherData(weatherResult);
    } catch (err) {
      console.error('获取天气数据失败:', err);
      // 设置默认天气数据
      setWeatherData({
        city: city,
        temperature: 20,
        condition: '晴',
        humidity: 50,
        windSpeed: 10,
        pressure: 1013,
      });
    }
  };

  // 获取预算数据 - 获取最近的非协同行程的预算
  const fetchBudgetData = async (currentTripId?: string) => {
    try {
      console.log('💰 开始获取预算数据...');
      const response = await getUserTrips();

      // getUserTrips返回的是response.data，结构为 { success: true, data: Trip[] }
      if (response.success && Array.isArray(response.data)) {
        const trips = response.data;
        console.log('📊 获取到的行程列表:', trips.length, '个');

        // 筛选非协同行程（source !== 'collab'）
        const nonCollabTrips = trips.filter((trip: any) => trip.source !== 'collab');
        console.log('📊 非协同行程:', nonCollabTrips.length, '个');

        // 按开始日期降序排序，获取最近的行程
        const sortedTrips = nonCollabTrips.sort((a: any, b: any) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        // 优先使用传入的tripId，否则使用最近的非协同行程
        let targetTrip;
        if (currentTripId) {
          targetTrip = sortedTrips.find((trip: any) => trip.id === currentTripId);
        }
        if (!targetTrip && sortedTrips.length > 0) {
          targetTrip = sortedTrips[0];
        }

        if (targetTrip) {
          // 优先使用budget对象，如果没有则使用totalBudget
          const budget = targetTrip.budget || {};
          const total = targetTrip.totalBudget || 0;

          console.log('✅ 预算数据:', {
            tripId: targetTrip.id,
            tripTitle: targetTrip.title,
            budget,
            total
          });

          setBudgetData({
            transportation: budget.transportation || 0,
            accommodation: budget.accommodation || 0,
            food: budget.food || 0,
            tickets: budget.tickets || 0,
            shopping: budget.shopping || 0,
            other: budget.other || 0,
            total: total,
          });
        } else {
          console.log('⚠️ 没有找到行程，设置默认预算数据');
          // 没有找到行程，设置默认预算数据
          setBudgetData({
            transportation: 0,
            accommodation: 0,
            food: 0,
            tickets: 0,
            shopping: 0,
            other: 0,
            total: 0,
          });
        }
      } else {
        console.log('⚠️ 响应格式不正确:', response);
      }
    } catch (err) {
      console.error('❌ 获取预算数据失败:', err);
      setBudgetData({
        transportation: 0,
        accommodation: 0,
        food: 0,
        tickets: 0,
        shopping: 0,
        other: 0,
        total: 0,
      });
    }
  };

  // 初始化数据的函数（提取到外部，供多处调用）
  const init = async () => {
    setLoading(true);
    try {
      console.log('🔄 开始初始化Homepage数据...');

      // 1. 并行获取基础数据
      const [tripsResult] = await Promise.all([
        fetchUserTrips(),
        fetchHotDestinations(), // 获取热门目的地
      ]);

      console.log('📊 行程数据获取结果:', tripsResult);

      // 2. 获取天气数据
      if (tripsResult?.trips && tripsResult.trips.length > 0) {
        // 提取所有目的地城市
        const citiesSet = new Set<string>();
        tripsResult.trips.forEach((trip: any) => {
          if (trip.destination) {
            citiesSet.add(trip.destination);
          }
        });
        const destinations = Array.from(citiesSet);
        setDestinationCities(destinations);

        // 使用第一个目的地城市的天气
        if (destinations.length > 0) {
          setSelectedCity(destinations[0]);
          await fetchWeatherData(destinations[0]);
        }
      } else {
        // 没有行程，使用默认城市北京
        await fetchWeatherData('北京');
      }

      if (!tripsResult || !tripsResult.currentTrip) {
        console.log('⚠️ 没有当前行程，跳过后续数据获取');
        setLoading(false);
        return;
      }

      const { currentTrip, trips } = tripsResult;

      // 3. 并行获取当前行程的相关数据和足迹城市
      await Promise.all([
        fetchPackingList(currentTrip.id),
        fetchPackingProgress(currentTrip.id),
        fetchBudgetData(), // 不传递tripId，自动获取最近的非协同行程预算
        calculateFootprintCities(trips).then(cities => setFootprintCities(cities)),
      ]);

      console.log('✅ Homepage数据初始化完成');

    } catch (err) {
      setError('加载数据失败');
      console.error('❌ 初始化数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据（组件挂载时执行）
  useEffect(() => {
    init();
  }, []); // 只在组件挂载时执行一次

  // 监听行程变化，自动刷新数据
  useEffect(() => {
    // 监听存储事件（当其他标签页创建/更新行程时）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trip-updated' || e.key === 'trip-created') {
        console.log('🔔 检测到行程变化，刷新数据...');
        // 清除缓存并重新获取数据
        cacheManager.clear();
        init();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 定时刷新数据（每30秒，提高更新频率）
    const refreshInterval = setInterval(() => {
      console.log('⏰ 定时刷新数据...');
      cacheManager.clear();
      init();
    }, 30 * 1000); // 改为30秒刷新一次

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(refreshInterval);
    };
  }, []);

  // 切换打包状态
  const togglePacked = async (itemId: string) => {
    setPackingItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, packed: !item.packed } : item
      )
    );
    // 这里应该调用API更新状态，暂时只更新本地状态
  };

  // 计算足迹城市 - 新增
  const calculateFootprintCities = async (trips: any[]): Promise<FootprintCity[]> => {
    const cityMap = new Map<string, FootprintCity>();

    for (const trip of trips) {
      if (!trip.destination) continue;

      const city = cityMap.get(trip.destination);
      if (city) {
        city.tripCount++;
        city.tripIds.push(trip.id);
      } else {
        // 获取城市坐标（从该城市的第一个景点获取）
        try {
          const spotsResponse = await apiClient.get(`/destinations/cities/${trip.destination}/spots`, {
            params: { limit: 1 }
          });

          let location = '';
          if (spotsResponse.data.success && spotsResponse.data.data.length > 0) {
            location = spotsResponse.data.data[0].location || '';
          }

          cityMap.set(trip.destination, {
            name: trip.destination,
            location: location,
            tripCount: 1,
            tripIds: [trip.id],
          });
        } catch (err) {
          console.error(`获取城市 ${trip.destination} 坐标失败:`, err);
          cityMap.set(trip.destination, {
            name: trip.destination,
            location: '',
            tripCount: 1,
            tripIds: [trip.id],
          });
        }
      }
    }

    return Array.from(cityMap.values());
  };

  // 获取热门目的地 - 新增
  const fetchHotDestinations = async () => {
    try {
      // 使用缓存获取热门目的地
      const response = await cacheManager.getOrSet(
        CACHE_KEYS.HOT_DESTINATIONS,
        async () => {
          const res = await apiClient.get('/destinations/cities');
          return res.data;
        },
        CACHE_TTL.LONG // 30分钟缓存（热门目的地变化较慢）
      );

      if (response.success) {
        const destinations = response.data.map((city: any) => ({
          city: city.name,
          spotCount: city.spotCount,
          coverImage: city.coverImage,
          description: city.description,
        }));
        setHotDestinations(destinations);
      }
    } catch (err) {
      console.error('获取热门目的地失败:', err);
    }
  };

  // 搜索功能 - 新增
  const search = async (keyword: string) => {
    if (!keyword.trim()) {
      // 显示热门推荐
      setSearchResults(
        hotDestinations.map(dest => ({
          type: 'destination' as const,
          id: dest.city,
          title: dest.city,
          subtitle: `${dest.spotCount}个热门景点`,
          image: dest.coverImage,
        }))
      );
      return;
    }

    const results: SearchResult[] = [];

    // 1. 搜索热门目的地
    const matchedDests = hotDestinations.filter(dest =>
      dest.city.includes(keyword)
    );
    results.push(...matchedDests.map(dest => ({
      type: 'destination' as const,
      id: dest.city,
      title: dest.city,
      subtitle: `${dest.spotCount}个热门景点`,
      image: dest.coverImage,
    })));

    // 2. 搜索用户行程
    try {
      const response = await getUserTrips();
      if (response.success) {
        const matchedTrips = response.data.filter((trip: any) =>
          trip.title.includes(keyword) || trip.destination.includes(keyword)
        );
        results.push(...matchedTrips.map((trip: any) => ({
          type: 'trip' as const,
          id: trip.id,
          title: trip.title,
          subtitle: trip.destination,
          image: trip.coverImage,
        })));
      }
    } catch (err) {
      console.error('搜索行程失败:', err);
    }

    // 3. 搜索Blog文章
    try {
      const response = await apiClient.get('/blogs');
      if (response.data.success) {
        const matchedBlogs = response.data.data.filter((blog: any) =>
          blog.title.includes(keyword)
        );
        results.push(...matchedBlogs.map((blog: any) => ({
          type: 'blog' as const,
          id: blog.id,
          title: blog.title,
          subtitle: blog.city || '游记',
          image: blog.coverImage,
        })));
      }
    } catch (err) {
      console.error('搜索Blog失败:', err);
    }

    setSearchResults(results);
  };

  // 切换城市（用于天气控件）- 新增
  const changeCity = async (city: string) => {
    setSelectedCity(city);
    await fetchWeatherData(city);
  };

  // 手动刷新缓存 - 清除所有缓存并重新获取数据
  const refreshCache = async () => {
    console.log('🔄 手动刷新缓存...');
    cacheManager.clear();
    // 重新初始化数据
    const init = async () => {
      setLoading(true);
      try {
        // 1. 并行获取基础数据
        const [tripsResult] = await Promise.all([
          fetchUserTrips(),
          fetchHotDestinations(), // 获取热门目的地
        ]);

        // 2. 获取天气数据
        if (tripsResult?.trips && tripsResult.trips.length > 0) {
          // 提取所有目的地城市
          const citiesSet = new Set<string>();
          tripsResult.trips.forEach((trip: any) => {
            if (trip.destination) {
              citiesSet.add(trip.destination);
            }
          });
          const destinations = Array.from(citiesSet);
          setDestinationCities(destinations);

          // 使用第一个目的地城市的天气
          if (destinations.length > 0) {
            setSelectedCity(destinations[0]);
            await fetchWeatherData(destinations[0]);
          }
        } else {
          // 没有行程，使用默认城市北京
          await fetchWeatherData('北京');
        }

        if (!tripsResult || !tripsResult.currentTrip) {
          setLoading(false);
          return;
        }

        const { currentTrip, trips } = tripsResult;

        // 3. 并行获取当前行程的相关数据和足迹城市
        await Promise.all([
          fetchPackingList(currentTrip.id),
          fetchPackingProgress(currentTrip.id),
          fetchBudgetData(), // 不传递tripId，自动获取最近的非协同行程预算
          calculateFootprintCities(trips).then(cities => setFootprintCities(cities)),
        ]);

      } catch (err) {
        setError('加载数据失败');
        console.error('初始化数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    await init();
  };

  return {
    loading,
    error,
    // 行李清单
    packingItems,
    packingProgress,
    togglePacked,
    // 天气
    weatherData,
    selectedCity,
    destinationCities,
    changeCity,
    // 预算
    budgetData,
    // 行程统计
    tripStats,
    // 即将出行
    upcomingTrips,
    // 行程日期
    tripDates,
    // 当前行程ID
    currentTripId,
    // 足迹城市（新增）
    footprintCities,
    // 热门目的地（新增）
    hotDestinations,
    // 搜索结果（新增）
    searchResults,
    search,
    // 缓存管理
    refreshCache,
  };
};
