// 时间轴博客展示组件 - 借鉴blog文件夹的ww2-timeline设计
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  Heart,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Tag
} from 'lucide-react';
import GlassLayout from './GlassLayout';
import { GlassCard } from './home';
import { message, Popconfirm } from 'antd';

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

interface BlogTimelineProps {
  blogs: Blog[];
  currentUserId?: string;
  onEdit?: (blogId: string) => void;
  onDelete?: (blogId: string) => void;
}

export default function BlogTimeline({ blogs, currentUserId, onEdit, onDelete }: BlogTimelineProps) {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      year: date.getFullYear().toString(),
      month: date.toLocaleDateString('zh-CN', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString().padStart(2, '0'),
      full: date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  };

  const getExcerpt = (blog: Blog) => {
    if (blog.excerpt) return blog.excerpt;
    if (blog.content) {
      const text = blog.content.replace(/<[^>]*>/g, '').trim();
      return text.length > 200 ? text.substring(0, 200) + '...' : text;
    }
    return '暂无内容';
  };

  const getLikes = (blog: Blog) => blog.likeCount || blog.likes || 0;
  const getComments = (blog: Blog) => blog.commentCount || blog.comments || 0;
  const getViews = (blog: Blog) => blog.viewCount || blog.views || 0;
  const getAuthor = (blog: Blog) => blog.author || '匿名用户';

  return (
    <GlassLayout>
      <div className="max-w-6xl mx-auto py-8">
        {/* 页面标题 */}
        <div className="mb-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight leading-none">
            旅行博客
          </h1>
          <p className="text-lg text-amber-400/80 tracking-wider">记录每一次精彩旅程</p>
        </div>

        {/* 时间轴 */}
        <div className="relative">
          {/* 垂直时间线 */}
          <div className="absolute left-0 md:left-[100px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/20 via-amber-500/40 to-amber-500/20" />

          {/* 博客列表 */}
          <div className="space-y-16 md:space-y-24">
            {blogs.map((blog, index) => {
              const date = formatDate(blog.createdAt);
              const isAuthor = currentUserId && blog.userId === currentUserId;

              return (
                <div
                  key={blog.id}
                  className="relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* 时间节点 */}
                  <div
                    className="absolute left-[-4px] md:left-[96px] top-0 w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-500/20 transition-all duration-300"
                    style={{
                      transform: hoveredIndex === index ? 'scale(1.5)' : 'scale(1)',
                    }}
                  />

                  {/* 内容区域 */}
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-12 pl-8 md:pl-0">
                    {/* 日期 */}
                    <div className="flex flex-col gap-1">
                      <div className="font-mono text-xs md:text-sm text-amber-500/60 tracking-widest">
                        {date.month} {date.day}
                      </div>
                      <div className="font-mono text-2xl md:text-3xl text-amber-500 tracking-tight font-bold">
                        {date.year}
                      </div>
                    </div>

                    {/* 博客卡片 */}
                    <div className="space-y-6 group">
                      <div className="space-y-3">
                        {/* 标题 */}
                        <h2
                          className="text-3xl md:text-4xl lg:text-5xl text-white leading-tight tracking-tight transition-colors duration-300 group-hover:text-amber-400/90 cursor-pointer"
                          onClick={() => navigate(`/blog/${blog.id}`)}
                        >
                          {blog.title}
                        </h2>

                        {/* 元信息 */}
                        <div className="flex flex-wrap items-center gap-4 text-white/60">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="text-sm">{getAuthor(blog)}</span>
                          </div>
                          {blog.city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{blog.city}</span>
                            </div>
                          )}
                        </div>

                        {/* 标签 */}
                        {blog.tags && (
                          <div className="flex flex-wrap gap-2">
                            {blog.tags.split(',').filter(t => t.trim()).slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs border border-amber-400/30 flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 摘要 */}
                        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-3xl">
                          {getExcerpt(blog)}
                        </p>
                      </div>

                      {/* 封面图片 */}
                      {blog.coverImage && (
                        <div
                          className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 transition-all duration-500 group-hover:border-amber-500/30 group-hover:shadow-2xl group-hover:shadow-amber-500/10 cursor-pointer"
                          onClick={() => navigate(`/blog/${blog.id}`)}
                        >
                          <div className="aspect-[16/10] relative">
                            <img
                              src={blog.coverImage}
                              alt={blog.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* 操作按钮 */}
                            {isAuthor && (
                              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onEdit && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEdit(blog.id);
                                    }}
                                    className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all"
                                    title="编辑"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                {onDelete && (
                                  <Popconfirm
                                    title="确定要删除这篇博客吗？"
                                    onConfirm={() => onDelete(blog.id)}
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
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 统计信息 */}
                      <div className="flex items-center gap-6 text-white/60">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{getLikes(blog)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">{getComments(blog)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">{getViews(blog)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 时间轴结束标记 */}
          <div className="relative mt-32 md:mt-40">
            <div className="absolute left-[-4px] md:left-[96px] top-0 w-2 h-2 rounded-full bg-white/30" />
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-12 pl-8 md:pl-0">
              <div className="flex flex-col gap-1">
                <div className="font-mono text-xs md:text-sm text-white/30 tracking-widest">
                  旅程继续
                </div>
              </div>
              <div className="space-y-8 max-w-3xl">
                <div className="h-px bg-gradient-to-r from-white/10 to-transparent mb-12" />
                <h2 className="text-4xl md:text-5xl lg:text-6xl text-white/40 leading-tight tracking-tight">
                  未完待续...
                </h2>
                <p className="text-white/30 text-lg md:text-xl leading-relaxed font-light">
                  每一次旅行都是一个新的故事，期待您的下一次精彩旅程！
                </p>
                <div className="pt-8">
                  <button
                    onClick={() => navigate('/blog/create')}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                  >
                    开始新的旅程
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassLayout>
  );
}
