// 旅行博客页面 - 连接后端 API
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, PenLine, MessageCircle, Sparkles, List, MapPin, ChevronRight, Eye, Clock } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';
import { getBlogPosts, toggleLike } from '../api/client';
import { extractFirstImage, calculateWordCount, calculateReadingTime, formatReadingTime } from '../utils/blogContentUtils';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  userId?: string;
  coverImage?: string;
  tags?: string[];
  city?: string;
  likes: number;
  views: number;
  comments: number;
  createdAt: string;
  updatedAt?: string;
  isPublished: boolean;
}

export default function Blogs() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'mostLiked'>('latest');

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [page, sortBy]);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const response = await getBlogPosts({
        isPublished: true,
        page,
        pageSize,
        sortBy,
      });

      if (response.success && response.data) {
        setBlogs(response.data.posts || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('❌ 加载博客失败:', error);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // 从 localStorage 获取用户 ID
      let userId = '';
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id || user.userId || '';
      }
      if (!userId) {
        userId = localStorage.getItem('userId') || 'default-user';
      }

      await toggleLike(postId, userId);
      loadBlogs();
    } catch (error) {
      console.error('❌ 点赞失败:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    return `${Math.floor(diffDays / 30)}月前`;
  };

  const getExcerpt = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
    return text.length > maxLength ? text.substring(0, maxLength) + '…' : text;
  };

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[240px] h-full flex items-center px-5 border-r border-border shrink-0">
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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isLargeScreen={isLargeScreen} currentPage={location.pathname} />

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

          {/* Sort Options */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === 'latest'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
              }`}
            >
              最新发布
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === 'popular'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
              }`}
            >
              最多浏览
            </button>
            <button
              onClick={() => setSortBy('mostLiked')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortBy === 'mostLiked'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
              }`}
            >
              最多点赞
            </button>
          </div>

          {/* Blog List */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <PenLine className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">暂无博客</h3>
              <p className="text-[14px] text-muted-foreground mb-6">
                成为第一个分享旅行故事的人吧
              </p>
              <button
                onClick={() => navigate('/blog/create')}
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                写博客
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {blogs.map(blog => (
                <div
                  key={blog.id}
                  onClick={() => navigate(`/blog/${blog.id}`)}
                  className="bg-card border border-border rounded-lg flex overflow-hidden hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer"
                >
                  {/* Left Image */}
                  <div className="relative w-[100px] flex-shrink-0 bg-gray-200">
                    {blog.coverImage || extractFirstImage(blog.content) ? (
                      <img src={blog.coverImage || extractFirstImage(blog.content)} alt={blog.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">📝</div>
                    )}
                  </div>

                  {/* Right Body */}
                  <div className="flex-1 p-3.5 px-4 flex flex-col">
                    <h3 className="text-sm font-medium text-foreground mb-1 leading-snug">{blog.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-2">
                      {blog.excerpt || getExcerpt(blog.content)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-muted-foreground">
                        by {blog.author?.name || '匿名用户'} · {formatDate(blog.createdAt)}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1" title={`${calculateWordCount(blog.content)}字`}>
                          <Clock className="w-3 h-3" />
                          {formatReadingTime(calculateReadingTime(calculateWordCount(blog.content)))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {blog.views || 0}
                        </span>
                        <button
                          onClick={(e) => handleToggleLike(blog.id, e)}
                          className="flex items-center gap-1 hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-3 h-3" />
                          {blog.likes || 0}
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {blog.comments || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {total > pageSize && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-muted-foreground hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  <span className="text-xs text-muted-foreground">
                    第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
                    disabled={page >= Math.ceil(total / pageSize)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-muted-foreground hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
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
