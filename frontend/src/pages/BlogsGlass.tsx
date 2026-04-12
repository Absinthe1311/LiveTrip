// 旅行博客页面 - 毛玻璃风格版本（优化版）
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Heart, MessageCircle, Eye, Edit2, Trash2, Plus, LayoutGrid, List } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { getBlogPosts, deleteBlog } from '../api/client';
import { message, Popconfirm } from 'antd';
import BlogTimeline from '../components/BlogTimeline';
import { BlogListSkeleton } from '../components/BlogSkeleton';
import EmptyState from '../components/EmptyState';

interface Blog {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  author?: string;
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
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid'); // 默认卡片视图

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
      const response = await getBlogPosts();
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
      }
      else {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 获取摘要
  const getExcerpt = (blog: Blog) => {
    if (blog.excerpt) return blog.excerpt;
    if (blog.content) {
      // 移除HTML标签并截取前150字符
      const text = blog.content.replace(/<[^>]*>/g, '').trim();
      return text.length > 150 ? text.substring(0, 150) + '...' : text;
    }
    return '暂无内容';
  };

  // 获取统计数据
  const getLikes = (blog: Blog) => blog.likeCount || blog.likes || 0;
  const getComments = (blog: Blog) => blog.commentCount || blog.comments || 0;
  const getViews = (blog: Blog) => blog.viewCount || blog.views || 0;
  const getAuthor = (blog: Blog) => blog.author || '匿名用户';

  // 处理编辑
  const handleEdit = (blogId: string) => {
    navigate(`/blog/edit?id=${blogId}`);
  };

  // 处理删除
  const handleDelete = async (blogId: string) => {
    try {
      await deleteBlog(blogId, currentUserId || 'default-user');
      message.success('博客删除成功');
      loadBlogs();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // 时间轴视图
  if (viewMode === 'timeline' && !loading && blogs.length > 0) {
    return (
      <BlogTimeline
        blogs={blogs}
        currentUserId={currentUserId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <GlassLayout>
      <div className="space-y-6">
        {/* 页面标题和操作栏 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">旅行博客</h1>
          <div className="flex items-center gap-3">
            {/* 视图切换按钮 */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-white/60 hover:text-white'
                }`}
                title="时间轴视图"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-white/60 hover:text-white'
                }`}
                title="卡片视图"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>

            {/* 写博客按钮 */}
            <button
              onClick={() => navigate('/blog/create')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              写博客
            </button>
          </div>
        </div>

        {/* 博客列表 */}
        {loading ? (
          <BlogListSkeleton count={4} />
        ) : blogs.length === 0 ? (
          <EmptyState type="blogs" />
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {blogs.map((blog) => (
              <GlassCard
                key={blog.id}
                className="p-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform group"
                onClick={() => navigate(`/blog/${blog.id}`)}
              >
                {/* 封面图片 */}
                <div className="relative h-48 bg-gradient-to-br from-amber-500 to-amber-600">
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
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{blog.title}</h3>
                  <p className="text-sm text-white/60 mb-4 line-clamp-2">{getExcerpt(blog)}</p>

                  {/* 标签 */}
                  {blog.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blog.tags.split(',').filter(t => t.trim()).slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs border border-amber-400/30"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-white/60">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{getAuthor(blog)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{formatDate(blog.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10 text-white/60">
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
