// 我的行程页面 - 基于 V0 设计重构
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Globe, PenLine, List, MapPin, ChevronRight, Plus, Camera } from "lucide-react";
import { getUserTrips, deleteTrip } from '../api/client';
import { Sidebar } from '../components/SharedSidebar';

type FilterStatus = "all" | "planning" | "completed";

export default function MyTrips() {
  const navigate = useNavigate();
  const location = useLocation();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTrips();
    
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const response = await getUserTrips();
      if (response.success && response.data) {
        setTrips(response.data);
      }
    } catch (error) {
      console.error('加载行程列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('确定要删除这个行程吗？')) return;
    
    setDeleting(tripId);
    try {
      const response = await deleteTrip(tripId);
      if (response.success) {
        loadTrips();
      }
    } catch (error) {
      console.error('删除行程失败:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.getFullYear()}/${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')} — ${String(end.getMonth() + 1).padStart(2, '0')}/${String(end.getDate()).padStart(2, '0')}`;
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days}天`;
  };

  const filteredTrips = trips.filter(trip => {
    if (filter === "all") return true;
    return trip.status === filter;
  });

  const counts = {
    all: trips.length,
    planning: trips.filter(t => t.status === 'planning').length,
    completed: trips.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[220px] h-full flex items-center px-4 border-r border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center">
              <span className="text-lg">✈️</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-livetrip-primary-dark font-serif">LiveTrip</span>
              <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">AI · IoT · Travel</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索目的地、景点、攻略…"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-none outline-none text-sm focus:ring-2 focus:ring-livetrip-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 px-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button 
            onClick={() => navigate('/favorites')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Heart className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-xs font-medium">
              ZL
            </div>
            <span className={`text-sm font-medium text-livetrip-primary-dark ${isLargeScreen ? 'block' : 'hidden'}`}>
              Zhang Lei
            </span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isLargeScreen={isLargeScreen}
        currentPage={location.pathname}
      />

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        <div className="max-w-4xl mx-auto px-6 py-6 lg:px-7">
          {/* Page Header */}
          <h1 className="font-serif text-xl font-semibold text-foreground mb-3.5">
            我的行程
          </h1>

          {/* Filter Tab Bar */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "all" as FilterStatus, label: "全部" },
              { key: "planning" as FilterStatus, label: "规划中" },
              { key: "completed" as FilterStatus, label: "已完成" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground border border-border hover:border-primary/50"
                }`}
              >
                {tab.label} ({counts[tab.key]})
              </button>
            ))}
          </div>

          {/* Trip Cards List */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTrips.map(trip => (
                <div
                  key={trip.id}
                  className="bg-card border border-border rounded-lg flex overflow-hidden hover:border-foreground/20 transition-all cursor-pointer"
                  onClick={() => navigate(`/trip/${trip.id}`)}
                >
                  {/* Left Image */}
                  <div className="relative w-[110px] min-h-[90px] flex-shrink-0 bg-gray-200">
                    <img
                      src={`https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&q=70`}
                      alt={trip.title || trip.destination}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Middle Body */}
                  <div className="flex-1 p-3.5 px-4">
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      {trip.title || trip.destination}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatDateRange(trip.startDate, trip.endDate)} · {calculateDuration(trip.startDate, trip.endDate)} · ¥{trip.totalBudget?.toLocaleString() || 0}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                        🏛 旅行
                      </span>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="p-3.5 px-4 flex flex-col items-end justify-between">
                    {/* Status Pill */}
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-md font-medium ${
                        trip.status === "planning"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-secondary text-primary"
                      }`}
                    >
                      {trip.status === "planning" ? "规划中" : "已完成"}
                    </span>

                    {/* Action */}
                    {trip.status === "planning" ? (
                      <span className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                        查看行程 →
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrip(trip.id);
                        }}
                        disabled={deleting === trip.id}
                        className="h-7 text-[11px] gap-1.5 px-3 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center"
                      >
                        <Camera className="w-3 h-3" />
                        删除
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredTrips.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">暂无行程</p>
                  <button
                    onClick={() => navigate('/plan')}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    创建新行程
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
