// 旅行博客页面 - 毛玻璃风格版本（优化版）

// AI辅助生成：GLM-4, 2026-4-21
// 删除时间轴视图功能：
// 1. 删除BlogTimeline组件导入
// 2. 删除viewMode状态管理
// 3. 删除视图切换按钮
// 4. 删除时间轴视图的条件渲染逻辑
// 5. 保留卡片视图作为唯一展示方式

// 人工修复：GLM-4, 2026-4-21
// 修复问题：无编译错误，代码直接可用
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  Heart,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  Plus,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import GlassLayout from '../components/layout/GlassLayout';
import { GlassCard } from '../components/home';
import { fetchPosts, delBlog } from '../api/client';
import { message, Popconfirm } from 'antd';
import { BlogListSkeleton } from '../components/blog/BlogSkeleton';
import EmptyState from '../components/common/EmptyState';

interface Blog {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  author?: {
    id: string;
    username: string;
    avatar?: string;
    nickname?: string;
  };
  userId?: string;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  likes?: number;
  comments?: number;
  views?: number;
  coverImage?: string;
  tags?: string;
  city?: string;
}

export default function BlogsGlass() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 获取当前用户
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const currentUserId = user?.id;

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      console.log('📡 开始加载博客列表...');
      const response = await fetchPosts();
      console.log('📦 API响应:', response);

      // 处理不同的响应格式
      if (response && response.success && response.data) {
        // 格式: { success: true, data: { posts: [], total: number } }
        if (response.data.posts && Array.isArray(response.data.posts)) {
          setBlogs(response.data.posts);
          console.log(`✅ 加载了 ${response.data.posts.length} 篇博客`);
        }
        // 格式: { success: true, data: [] }
        else if (Array.isArray(response.data)) {
          setBlogs(response.data);
          console.log(`✅ 加载了 ${response.data.length} 篇博客`);
        }
      }
      // 格式: { posts: [], total: number }
      else if (response && response.posts && Array.isArray(response.posts)) {
        setBlogs(response.posts);
        console.log(`✅ 加载了 ${response.posts.length} 篇博客`);
      }
      // 格式: []
      else if (Array.isArray(response)) {
        setBlogs(response);
        console.log(`✅ 加载了 ${response.length} 篇博客`);
      } else {
        console.warn('⚠️ 未知的响应格式:', response);
        setBlogs([]);
      }
    } catch (error) {
      console.error('❌ 加载博客失败:', error);
      message.error('加载博客失败');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  // 过滤博客
  const filteredBlogs = blogs.filter((blog) => {
    // 搜索文本（标题）
    if (searchText && !blog.title.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    // 搜索城市
    if (searchCity && blog.city && !blog.city.toLowerCase().includes(searchCity.toLowerCase())) {
      return false;
    }
    // 搜索标签
    if (searchTag && blog.tags) {
      const tags = blog.tags.split(',').map((t) => t.trim().toLowerCase());
      if (!tags.some((t) => t.includes(searchTag.toLowerCase()))) {
        return false;
      }
    }
    return true;
  });

  // 清空搜索
  const clearSearch = () => {
    setSearchText('');
    setSearchCity('');
    setSearchTag('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 获取统计数据
  const getLikes = (blog: Blog) => blog.likeCount || blog.likes || 0;
  const getComments = (blog: Blog) => blog.commentCount || blog.comments || 0;
  const getViews = (blog: Blog) => blog.viewCount || blog.views || 0;
  const getAuthorName = (blog: Blog) =>
    blog.author?.nickname || blog.author?.username || '匿名用户';
  const getAuthorAvatar = (blog: Blog) => blog.author?.avatar;

  // 处理编辑
  const handleEdit = (blogId: string) => {
    navigate(`/blog/edit?id=${blogId}`);
  };

  // 处理删除
  const handleDelete = async (blogId: string) => {
    try {
      const response = await delBlog(blogId, currentUserId || 'default-user');
      if (response.success) {
        message.success('博客删除成功');
        // 直接从列表中移除，无需重新加载
        setBlogs((prevBlogs) => prevBlogs.filter((blog) => blog.id !== blogId));
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  return (
    <GlassLayout showSearch={false}>
      <div className="space-y-6">
        {/* 页面标题和操作栏 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">旅行博客</h1>
          <div className="flex items-center gap-3">
            {/* 写博客按钮 */}
            <button
              onClick={() => navigate('/blog/create')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#CDEDDE] to-[#CDEDDE]/80 text-[#005746] font-semibold hover:shadow-lg hover:shadow-[#CDEDDE]/40 transition-all flex items-center gap-2 border border-[#CDEDDE]/50"
            >
              <Plus className="w-5 h-5" />
              写博客
            </button>
          </div>
        </div>

        {/* 搜索栏 */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center gap-4">
            {/* 主搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="搜索博客标题..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#145F39]/50 transition-all"
              />
            </div>

            {/* 筛选按钮 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg border transition-all flex items-center gap-2 ${
                showFilters
                  ? 'bg-[#145F39]/20 border-[#145F39]/50 text-[#CDEDDE]'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <Search className="w-4 h-4" />
              高级筛选
            </button>

            {/* 清空按钮 */}
            {(searchText || searchCity || searchTag) && (
              <button
                onClick={clearSearch}
                className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                清空
              </button>
            )}
          </div>

          {/* 高级筛选 */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm text-white/60 mb-2 block">城市</label>
                <input
                  type="text"
                  placeholder="输入城市名称..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#145F39]/50 transition-all text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-white/60 mb-2 block">标签</label>
                <input
                  type="text"
                  placeholder="输入标签..."
                  value={searchTag}
                  onChange={(e) => setSearchTag(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#145F39]/50 transition-all text-sm"
                />
              </div>
            </div>
          )}
        </GlassCard>

        {/* 博客列表 */}
        {loading ? (
          <BlogListSkeleton count={4} />
        ) : filteredBlogs.length === 0 ? (
          <EmptyState type="blogs" />
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {filteredBlogs.map((blog) => (
              <GlassCard
                key={blog.id}
                className="p-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform group"
                onClick={() => navigate(`/blog/${blog.id}`)}
              >
                {/* 封面图片 */}
                <div className="relative h-48 bg-gradient-to-br from-[#145F39] to-[#005746]">
                  {blog.coverImage && (
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* 操作按钮 - 仅作者可见 */}
                  {currentUserId && blog.userId === currentUserId && (
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(blog.id);
                        }}
                        className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <Popconfirm
                        title="确定要删除这篇博客吗？"
                        onConfirm={() => handleDelete(blog.id)}
                        onCancel={(e) => e?.stopPropagation()}
                        okText="确定"
                        cancelText="取消"
                      >
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-red-500/20 backdrop-blur-sm text-red-300 hover:bg-red-500/30 transition-all"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Popconfirm>
                    </div>
                  )}
                </div>

                {/* 博客信息 */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">{blog.title}</h3>

                  {/* 城市和标签 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {blog.city && (
                      <span className="px-2 py-1 rounded-md bg-[#145F39]/20 text-[#CDEDDE] text-xs border border-[#145F39]/30 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {blog.city}
                      </span>
                    )}
                    {blog.tags &&
                      blog.tags.trim() &&
                      blog.tags.split(',').filter((t) => t.trim()).length > 0 && (
                        <>
                          {blog.tags
                            .split(',')
                            .filter((t) => t.trim())
                            .slice(0, 2)
                            .map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 rounded-md bg-[#008F8D]/20 text-[#CDEDDE] text-xs border border-[#008F8D]/30"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                        </>
                      )}
                  </div>

                  {/* 作者和日期 */}
                  <div className="flex items-center justify-between mb-4 text-white/60">
                    <div className="flex items-center gap-2">
                      {getAuthorAvatar(blog) ? (
                        <img
                          src={getAuthorAvatar(blog)}
                          alt="avatar"
                          className="h-5 w-5 rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span className="text-sm">{getAuthorName(blog)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{formatDate(blog.createdAt)}</span>
                    </div>
                  </div>

                  {/* 统计数据 */}
                  <div className="flex items-center gap-6 pt-4 border-t border-white/10 text-white/60">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{getLikes(blog)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{getComments(blog)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{getViews(blog)}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </GlassLayout>
  );
}
