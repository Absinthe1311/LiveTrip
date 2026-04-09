// 旅行博客页面 - 毛玻璃风格版本
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Heart, MessageCircle, Eye } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { getBlogPosts } from '../api/client';
import { message } from 'antd';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  createdAt: string;
  likes: number;
  comments: number;
  views: number;
  coverImage?: string;
}

export default function BlogsGlass() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const response = await getBlogPosts();
      if (response && response.data) {
        setBlogs(Array.isArray(response.data) ? response.data : []);
      } else if (Array.isArray(response)) {
        setBlogs(response);
      }
    } catch (error) {
      console.error('加载博客失败:', error);
      message.error('加载博客失败');
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

  return (
    <GlassLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">旅行博客</h1>
          <button
            onClick={() => navigate('/blog/create')}
            className="px-6 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors"
          >
            写博客
          </button>
        </div>

        {/* 博客列表 */}
        {loading ? (
          <GlassCard className="p-8">
            <div className="text-center text-white/60">加载中...</div>
          </GlassCard>
        ) : blogs.length === 0 ? (
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">还没有博客</h3>
              <p className="text-white/60 mb-4">分享你的旅行故事吧！</p>
              <button
                onClick={() => navigate('/blog/create')}
                className="px-6 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors"
              >
                写博客
              </button>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {blogs.map((blog) => (
              <GlassCard
                key={blog.id}
                className="p-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => navigate(`/blog/${blog.id}`)}
              >
                {/* 封面图片 */}
                <div className="relative h-48 bg-gradient-to-br from-livetrip-primary to-livetrip-accent">
                  {blog.coverImage && (
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* 博客信息 */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{blog.title}</h3>
                  <p className="text-sm text-white/60 mb-4 line-clamp-2">{blog.excerpt}</p>

                  <div className="flex items-center justify-between text-white/60">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{blog.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{formatDate(blog.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10 text-white/60">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{blog.likes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{blog.comments}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{blog.views}</span>
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
