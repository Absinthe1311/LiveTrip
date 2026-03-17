"use client";

import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserTrips, getFavoriteCount, getHotDestinations } from "@/api/client";

export function HomeContent() {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState<any[]>([]);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [hotDestinations, setHotDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载统计数据
      const tripsResponse = await getUserTrips();
      const favoritesResponse = await getFavoriteCount();
      const destinationsResponse = await getHotDestinations();

      if (tripsResponse.success && tripsResponse.data) {
        const trips = tripsResponse.data;
        const completedTrips = trips.filter((t: any) => t.status === 'completed');
        
        setStatsData([
          {
            label: "行程总数",
            value: trips.length,
            change: `本月新增 ${trips.length}`,
            trend: "up",
          },
          {
            label: "已完成",
            value: completedTrips.length,
            change: null,
            trend: null,
          },
          {
            label: "收藏景点",
            value: favoritesResponse.count || favoritesResponse.data?.length || 0,
            change: `新增 3`,
            trend: "up",
          },
        ]);

        // 最近行程（取前3个）
        setRecentTrips(trips.slice(0, 3));
      }

      if (destinationsResponse.success && destinationsResponse.data) {
        setHotDestinations(destinationsResponse.data.slice(0, 5));
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${start.getMonth() + 1}月${start.getDate()}日 — ${end.getMonth() + 1}月${end.getDate()}日 (${days}天)`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-livetrip-primary-light text-livetrip-primary-dark';
      case 'planning':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'planning':
        return '规划中';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="relative h-[220px] w-full rounded-xl overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80')",
          }}
        />
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(15,74,50,0.85) 0%, transparent 100%)',
          }}
        />
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          <div className="text-white">
            <p className="text-xs uppercase tracking-wider mb-2 opacity-90">欢迎回来</p>
            <h2 className="font-serif text-3xl font-semibold mb-1 leading-tight">
              你好，今天去哪儿？
            </h2>
            <p className="text-sm opacity-90 mb-4">
              你有 {statsData.find(s => s.label === '行程总数')?.value || 0} 个行程正在规划中
            </p>
          </div>
          <Button 
            className="bg-livetrip-accent hover:bg-livetrip-accent/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all self-start"
            onClick={() => navigate('/plan')}
          >
            <Plus className="h-4 w-4 mr-2" />
            规划新行程
          </Button>
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {statsData.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-semibold text-livetrip-primary-dark mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              {stat.change && (
                <div className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Trips Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold text-gray-900">最近行程</h3>
          <Button 
            variant="ghost" 
            className="text-livetrip-primary hover:text-livetrip-primary-dark p-0 h-auto"
            onClick={() => navigate('/my-trips')}
          >
            查看全部 <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="space-y-3">
          {recentTrips.map((trip, index) => (
            <Card 
              key={index}
              className="border-0 shadow-sm hover:shadow-md hover:translate-x-1 transition-all cursor-pointer"
              onClick={() => navigate(`/trip/${trip.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 bg-cover bg-center"
                  style={{
                    backgroundImage: trip.hotelName 
                      ? `url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=100&q=70)`
                      : `url(https://images.unsplash.com/photo-${1500000000000 + index * 1000000}?w=100&q=70)`
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {trip.title || trip.destination}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDateRange(trip.startDate, trip.endDate)} · ¥{trip.totalBudget || 0}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(trip.status)}`}>
                  {getStatusText(trip.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Hot Destinations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold text-gray-900">热门目的地</h3>
          <Button 
            variant="ghost" 
            className="text-livetrip-primary hover:text-livetrip-primary-dark p-0 h-auto"
            onClick={() => navigate('/destinations')}
          >
            更多 <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {hotDestinations.map((dest, index) => (
            <Card 
              key={index}
              className="flex-shrink-0 w-[160px] border-0 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
              onClick={() => navigate(`/destination/${dest.id}`)}
            >
              <div 
                className="h-[100px] bg-cover bg-center rounded-t-lg"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-${1500000000000 + index * 1000000}?w=300&q=70)`
                }}
              />
              <CardContent className="p-3">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {dest.name}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-amber-500">
                    <Star className="h-3 w-3 fill-current mr-1" />
                    {dest.rating || 4.5}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dest.days}天
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
