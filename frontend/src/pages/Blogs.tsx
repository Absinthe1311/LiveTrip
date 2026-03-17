// 旅行博客页面 - 基于 V0 设计重构
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, PenLine, MessageCircle, Sparkles, List, MapPin, ChevronRight } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';

const blogs = [
  {
    id: 1,
    title: "三月京都，满城樱花如梦",
    excerpt: "伏见稻荷的朱红鸟居配上落樱，是我见过最美的画面。早上六点出发，整条参道只有我一人…",
    author: "Li Mei",
    date: "2天前",
    likes: 234,
    comments: 18,
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=200&q=70",
  },
  {
    id: 2,
    title: "巴厘岛7日，从零到惊艳",
    excerpt: "带着预算5000元，我拿下了五星级Villa和私人泳池。藏在Seminyak背街的这家民宿，绝对是隐藏宝藏…",
    author: "Wang Fang",
    date: "5天前",
    likes: 189,
    comments: 32,
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&q=70",
  },
  {
    id: 3,
    title: "东京拉面地图：米其林之外的宝藏小店",
    excerpt: "不用排队两小时，就能吃到极品拉面。这几条巷子里藏着老板专门为懂行人留的隐秘菜单…",
    author: "Chen Hao",
    date: "1周前",
    likes: 312,
    comments: 45,
    placeholder: "🍜",
  },
];

export default function Blogs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[220px] h-full flex items-center px-4 border-r border-border shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}>
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center"><span className="text-lg">✈️</span></div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-livetrip-primary-dark font-serif">LiveTrip</span>
              <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">AI · IoT · Travel</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="搜索目的地、景点、攻略…" className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-none outline-none text-sm focus:ring-2 focus:ring-livetrip-primary/20 transition-all" />
          </div>
        </div>

        <div className="flex items-center gap-1 px-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={() => navigate('/favorites')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-xs font-medium">ZL</div>
            <span className={`text-sm font-medium text-livetrip-primary-dark ${isLargeScreen ? 'block' : 'hidden'}`}>Zhang Lei</span>
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
          <div className="mb-4">
            <h1 className="font-serif text-xl font-semibold text-foreground">旅行博客</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">分享你的旅行故事与攻略</p>
          </div>

          {/* Create Post Bar */}
          <div onClick={() => navigate('/blog/create')} className="bg-card border border-dashed border-[1.5px] border-border rounded-lg mb-4 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-3 p-3.5 px-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs text-white font-medium">ZL</div>
              <span className="flex-1 text-[13px] text-muted-foreground">分享你的旅行故事…</span>
              <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                发布博客
              </button>
            </div>
          </div>

          {/* Blog List */}
          <div className="space-y-2.5">
            {blogs.map(blog => (
              <div key={blog.id} className="bg-card border border-border rounded-lg flex overflow-hidden hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer">
                {/* Left Image */}
                <div className="relative w-[100px] flex-shrink-0 bg-gray-200">
                  {blog.image ? (
                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">{blog.placeholder}</div>
                  )}
                </div>

                {/* Right Body */}
                <div className="flex-1 p-3.5 px-4 flex flex-col">
                  <h3 className="text-sm font-medium text-foreground mb-1 leading-snug">{blog.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-2">{blog.excerpt}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-muted-foreground">by {blog.author} · {blog.date}</span>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{blog.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{blog.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
