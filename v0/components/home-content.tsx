"use client";

import { Plus, ArrowRight, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statsData = [
  {
    label: "行程总数",
    value: 4,
    change: "本月新增 1",
    trend: "up",
  },
  {
    label: "已完成",
    value: 2,
    change: null,
    trend: null,
  },
  {
    label: "收藏景点",
    value: 12,
    change: "新增 3",
    trend: "up",
  },
];

const recentTrips = [
  {
    name: "东京深度游 · 7天",
    dates: "2026/03/20 — 03/27",
    budget: "¥8,500",
    status: "规划中",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&q=70",
  },
  {
    name: "京都赏樱 · 5天",
    dates: "2026/02/01 — 02/05",
    budget: "¥6,200",
    status: "已完成",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=100&q=70",
  },
  {
    name: "巴厘岛度假 · 6天",
    dates: "2025/12/24 — 12/30",
    budget: "¥5,800",
    status: "已完成",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=100&q=70",
  },
];

const hotDestinations = [
  {
    name: "东京",
    rating: 4.9,
    days: "7天推荐",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&q=70",
  },
  {
    name: "京都",
    rating: 4.8,
    days: "5天推荐",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=300&q=70",
  },
  {
    name: "巴厘岛",
    rating: 4.7,
    days: "6天推荐",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&q=70",
  },
  {
    name: "巴黎",
    rating: 4.8,
    days: "8天推荐",
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=300&q=70",
  },
  {
    name: "巴塞罗那",
    rating: 4.7,
    days: "7天推荐",
    image: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=300&q=70",
  },
];

export function HomeContent() {
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
            background: "linear-gradient(to right, rgba(15,74,50,0.85) 0%, rgba(15,74,50,0.5) 50%, transparent 100%)",
          }}
        />
        {/* Content */}
        <div className="relative h-full flex items-end justify-between p-6">
          <div className="text-white">
            <p className="text-xs uppercase tracking-wider text-white/80 mb-1">
              欢迎回来
            </p>
            <h1 className="text-3xl font-serif font-semibold leading-tight">
              Zhang Lei，
              <br />
              今天去哪儿？
            </h1>
            <p className="text-sm text-white/80 mt-2">
              你有 1 个行程正在规划中
            </p>
          </div>
          <Button 
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-5 py-2.5 shadow-lg"
            style={{
              boxShadow: "0 4px 14px rgba(245, 166, 35, 0.4)",
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            规划新行程
          </Button>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-3 gap-4">
        {statsData.map((stat) => (
          <Card key={stat.label} className="border border-border bg-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-medium text-foreground mt-1">
                {stat.value}
              </p>
              {stat.change && (
                <p className="text-xs text-primary flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Recent Trips Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">最近行程</h2>
          <button className="text-sm text-primary hover:text-primary/80 flex items-center transition-colors">
            查看全部 <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        <div className="space-y-3">
          {recentTrips.map((trip) => (
            <Card 
              key={trip.name}
              className="border border-border bg-card hover:border-l-primary hover:border-l-2 hover:translate-x-0.5 transition-all cursor-pointer"
            >
              <CardContent className="p-3 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={trip.image}
                    alt={trip.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {trip.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {trip.dates} · {trip.budget}
                  </p>
                </div>
                {/* Status Pill */}
                <span
                  className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${
                    trip.status === "规划中"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-secondary text-primary"
                  }`}
                >
                  {trip.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Hot Destinations Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">热门目的地</h2>
          <button className="text-sm text-primary hover:text-primary/80 flex items-center transition-colors">
            更多 <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        {/* Horizontal Scroll Container */}
        <div 
          className="flex gap-4 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {hotDestinations.map((dest) => (
            <Card 
              key={dest.name}
              className="w-40 flex-shrink-0 border border-border bg-card overflow-hidden hover:-translate-y-0.5 transition-transform cursor-pointer"
            >
              {/* Image */}
              <div className="h-[100px] overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Info */}
              <CardContent className="p-3">
                <p className="font-medium text-foreground">{dest.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center text-xs text-amber-500">
                    <Star className="h-3 w-3 mr-0.5 fill-current" />
                    {dest.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {dest.days}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
