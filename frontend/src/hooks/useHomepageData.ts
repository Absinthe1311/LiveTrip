// Homepage数据管理Hook - 统一管理首页所有数据获取
import { useState, useEffect } from 'react';
import {
  getUserTrips,
  getPackingList,
  getPackingProgress,
  getIoTData,
  apiClient,
} from '../api/client';

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
      const response = await getUserTrips();
      if (response.data.success) {
        const trips = response.data.trips;
        console.log('获取到的行程列表:', trips);
        
        // 计算统计数据
        const totalTrips = trips.length;
        const completedTrips = trips.filter((trip: any) => trip.status === 'completed').length;
        const upcomingTrips = trips.filter((trip: any) => {
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
          upcomingTrips,
        });

        // 获取即将出行的行程（未来3个）
        const upcoming = trips
          .filter((trip: any) => {
            const startDate = new Date(trip.startDate);
            return startDate > new Date();
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
        const sortedTrips = trips.sort((a: any, b: any) => 
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
      }
    } catch (err) {
      console.error('获取行程列表失败:', err);
    }
  };

  // 获取行李清单
  const fetchPackingList = async (tripId: string) => {
    try {
      const response = await getPackingList(tripId);
      if (response.data.success) {
        const items = response.data.packingItems.map((item: any) => ({
          id: item.id,
          name: item.itemName,
          packed: item.isPacked,
          category: item.category,
        }));
        setPackingItems(items);
      }
    } catch (err) {
      console.error('获取行李清单失败:', err);
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

  // 获取天气数据 - 改造：从IoT数据中提取指定城市的天气
  const fetchWeatherData = async (city: string) => {
    try {
      // 1. 获取该城市的景点（取第一个景点的天气）
      const spotsResponse = await apiClient.get(`/destinations/cities/${city}/spots`, {
        params: { limit: 1 }
      });

      if (spotsResponse.data.success && spotsResponse.data.data.length > 0) {
        const spot = spotsResponse.data.data[0];

        // 2. 获取该景点的IoT数据（包含天气）
        const iotResponse = await getIoTData();
        if (iotResponse.success) {
          const spotIoT = iotResponse.data.spots.find(
            (s: any) => s.id === spot.id || s.name.includes(spot.name)
          );

          if (spotIoT) {
            setWeatherData({
              city: city,
              temperature: spotIoT.temperature || 20,
              condition: spotIoT.weatherDescription || '晴',
              humidity: spotIoT.humidity || 50,
              windSpeed: 10, // IoT数据中没有风速
              pressure: 1013, // IoT数据中没有气压
              icon: spotIoT.weatherIcon,
            });
            return;
          }
        }
      }

      // 降级：使用默认天气数据
      setWeatherData({
        city: city,
        temperature: 20,
        condition: '晴',
        humidity: 50,
        windSpeed: 10,
        pressure: 1013,
      });
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

  // 获取预算数据
  const fetchBudgetData = async (tripId: string) => {
    try {
      const response = await getUserTrips();
      if (response.data.success) {
        const trip = response.data.trips.find((t: any) => t.id === tripId);
        if (trip) {
          // 优先使用budget对象，如果没有则使用totalBudget
          const budget = trip.budget || {};
          const total = trip.totalBudget || 0;
          
          setBudgetData({
            transportation: budget.transportation || 0,
            accommodation: budget.accommodation || 0,
            food: budget.food || 0,
            tickets: budget.tickets || 0,
            shopping: budget.shopping || 0,
            other: budget.other || 0,
            total: total,
          });
        }
      }
    } catch (err) {
      console.error('获取预算数据失败:', err);
    }
  };

  // 初始化数据
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 1. 并行获取基础数据
        const [tripsResult] = await Promise.all([
          fetchUserTrips(),
          fetchHotDestinations(), // 获取热门目的地
        ]);

        // 2. 获取默认天气（北京）
        await fetchWeatherData('北京');

        if (!tripsResult || !tripsResult.currentTrip) {
          setLoading(false);
          return;
        }

        const { currentTrip, trips } = tripsResult;

        // 3. 并行获取当前行程的相关数据和足迹城市
        await Promise.all([
          fetchPackingList(currentTrip.id),
          fetchPackingProgress(currentTrip.id),
          fetchBudgetData(currentTrip.id),
          calculateFootprintCities(trips).then(cities => setFootprintCities(cities)),
        ]);

      } catch (err) {
        setError('加载数据失败');
        console.error('初始化数据失败:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []); // 移除 currentTripId 依赖，只在组件挂载时执行一次

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
      const response = await apiClient.get('/destinations/cities');
      if (response.data.success) {
        const destinations = response.data.data.map((city: any) => ({
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
  };
};
