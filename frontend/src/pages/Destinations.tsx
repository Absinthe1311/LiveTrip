// 热门目的地页面 - 优化版本
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, ChevronRight } from 'lucide-react';
import GlassLayout from '../components/layout/GlassLayout';
import { GlassCard } from '../components/home';
import { SpotCard } from '../components/spot/SpotCardLegacy';
import { getHotCities, getCitySpots, getCityAllSpots, HotCity, HotSpot } from '../api/client';
import { message } from 'antd';

// 根据分类生成标签颜色
const getTagColor = (category: string) => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('博物馆') || categoryLower.includes('museum')) {
    return 'bg-purple-500/20 text-purple-300';
  }
  if (categoryLower.includes('公园') || categoryLower.includes('park')) {
    return 'bg-green-500/20 text-green-300';
  }
  if (categoryLower.includes('风景名胜') || categoryLower.includes('scenic')) {
    return 'bg-blue-500/20 text-blue-300';
  }
  if (categoryLower.includes('寺庙') || categoryLower.includes('temple')) {
    return 'bg-orange-500/20 text-orange-300';
  }
  if (categoryLower.includes('广场') || categoryLower.includes('plaza')) {
    return 'bg-cyan-500/20 text-cyan-300';
  }
  return 'bg-amber-500/20 text-amber-300';
};

// 生成描述文字
const generateDescription = (name: string, category?: string, city?: string) => {
  const descriptions: Record<string, string> = {
    '巧克巧蔻·巧克力博物馆(北京馆)': 
      '探索巧克力的奇妙世界，了解巧克力制作工艺与文化历史。这里展示了来自世界各地的珍贵巧克力藏品，是巧克力爱好者的天堂。您可以参与互动体验，亲手制作属于自己的巧克力作品，感受甜蜜与创意的完美结合。',
  };
  
  return descriptions[name] || `${name}是一处值得探访的${category || '景点'}，位于${city || '北京'}，为游客提供独特的游览体验。`;
};

export default function DestinationsGlass() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<HotCity[]>([]);
  const [citySpots, setCitySpots] = useState<Record<string, HotSpot[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityAllSpots, setCityAllSpots] = useState<HotSpot[]>([]);
  const [cityAllSpotsLoading, setCityAllSpotsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 加载热门城市和每个城市的景点
  useEffect(() => {
    loadInitialData();
  }, []);

  // 当选择城市时，加载该城市的所有景点
  useEffect(() => {
    if (selectedCity) {
      loadCityAllSpots(selectedCity, 1);
    }
  }, [selectedCity]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // 1. 加载热门城市列表
      const citiesResponse = await getHotCities();
      if (!citiesResponse.success || !citiesResponse.data) {
        throw new Error('获取城市列表失败');
      }

      const citiesData = citiesResponse.data as HotCity[];
      setCities(citiesData);

      // 2. 并行加载每个城市的9个景点
      const spotsPromises = citiesData.map(async (city) => {
        const spotsResponse = await getCitySpots(city.name, 9);
        if (spotsResponse.success && spotsResponse.data) {
          return { city: city.name, spots: spotsResponse.data as HotSpot[] };
        }
        return { city: city.name, spots: [] };
      });

      const spotsResults = await Promise.all(spotsPromises);
      const spotsMap: Record<string, HotSpot[]> = {};
      spotsResults.forEach((result) => {
        spotsMap[result.city] = result.spots;
      });

      setCitySpots(spotsMap);
      console.log(`✅ 加载了 ${citiesData.length} 个城市的热门景点`);
    } catch (error) {
      console.error('加载热门目的地失败:', error);
      message.error('加载热门目的地失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCityAllSpots = async (city: string, page: number) => {
    try {
      setCityAllSpotsLoading(true);
      const response = await getCityAllSpots(city, page, 12);

      if (response.success && response.data) {
        setCityAllSpots(response.data.spots);
        setTotalPages(response.data.totalPages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('加载城市景点失败:', error);
      message.error('加载城市景点失败');
    } finally {
      setCityAllSpotsLoading(false);
    }
  };

  // 城市详情页
  if (selectedCity) {
    const city = cities.find((c) => c.name === selectedCity);

    return (
      <GlassLayout showSearch={false}>
        <div className="space-y-6">
          {/* 返回按钮和城市标题 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedCity(null);
                setCityAllSpots([]);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              返回
            </button>
            {city && (
              <>
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-amber-400" />
                  <h1 className="text-3xl font-bold text-white">{city.name}</h1>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <span>{city.spotCount} 个景点</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    平均 {city.avgRating} 分
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 分类标签 */}
          {city && (
            <div className="flex items-center gap-2">
              {city.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full bg-amber-500/20 text-sm text-amber-300"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* 景点列表 */}
          {cityAllSpotsLoading ? (
            <GlassCard className="p-8">
              <div className="text-center text-white/60">加载中...</div>
            </GlassCard>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cityAllSpots.map((spot) => (
                  <SpotCard
                    key={spot.id}
                    spot={spot}
                    getTagColor={getTagColor}
                    generateDescription={generateDescription}
                  />
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => loadCityAllSpots(selectedCity, currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                  >
                    上一页
                  </button>
                  <span className="text-white/60">
                    第 {currentPage} / {totalPages} 页
                  </span>
                  <button
                    onClick={() => loadCityAllSpots(selectedCity, currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </GlassLayout>
    );
  }

  // 主页面：显示6个城市的3x3景点展示
  return (
    <GlassLayout showSearch={false}>
      <div className="space-y-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">热门目的地</h1>
            <p className="text-white/60 mt-2">探索中国最受欢迎的旅游城市</p>
          </div>
        </div>

        {/* 城市列表 */}
        {loading ? (
          <GlassCard className="p-8">
            <div className="text-center text-white/60">加载中...</div>
          </GlassCard>
        ) : cities.length === 0 ? (
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-white mb-2">暂无热门目的地</h3>
              <p className="text-white/60">请稍后再试</p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-8">
            {cities.map((city) => {
              const spots = citySpots[city.name] || [];

              return (
                <div key={city.name} className="space-y-4">
                  {/* 城市标题栏 */}
                  <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setSelectedCity(city.name)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-amber-400" />
                        <h2 className="text-2xl font-bold text-white">{city.name}</h2>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <span>{city.spotCount} 个热门景点</span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          平均 {city.avgRating} 分
                        </span>
                      </div>
                      {/* 分类标签 */}
                      <div className="flex items-center gap-2">
                        {city.categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 rounded-full bg-amber-500/20 text-xs text-amber-300"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/60 group-hover:text-white">
                      <span className="text-sm">查看全部</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* 3x3 景点展示 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {spots.length > 0 ? (
                      spots.map((spot) => (
                        <SpotCard
                          key={spot.id}
                          spot={spot}
                          getTagColor={getTagColor}
                          generateDescription={generateDescription}
                        />
                      ))
                    ) : (
                      <div className="col-span-3">
                        <GlassCard className="p-4">
                          <div className="text-center text-white/40">暂无景点数据</div>
                        </GlassCard>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassLayout>
  );
}








