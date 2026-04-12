// Blog详情页面 - 毛玻璃风格
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Eye,
  Share2,
  Calendar,
  User,
  Tag,
  MapPin,
  Edit2,
  Trash2
} from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { getBlogPostById, deleteBlog, toggleLike } from '../api/client';
import { message, Popconfirm } from 'antd';

interface BlogDetail {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  tags?: string;
  city?: string;
  userId?: string;
  author?: string;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  isPublished?: boolean;
}

export default function BlogDetailGlass() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  // 获取当前用户
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const currentUserId = user?.id;

  useEffect(() => {
    if (id) {
      loadBlogDetail(id);
    }
  }, [id]);

  const loadBlogDetail = async (blogId: string) => {
    try {
      setLoading(true);
      const response = await getBlogPostById(blogId);
      if (response.success && response.data) {
        setBlog(response.data);
      }
    } catch (error) {
      message.error('加载博客详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!blog) return;
    try {
      await toggleLike(blog.id, currentUserId || 'default-user');
      setLiked(!liked);
      if (blog.likeCount !== undefined) {
        setBlog({
          ...blog,
          likeCount: liked ? blog.likeCount - 1 : blog.likeCount + 1
        });
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleEdit = () => {
    if (!blog) return;
    navigate(`/blog/edit?id=${blog.id}`);
  };

  const handleDelete = async () => {
    if (!blog) return;
    try {
      await deleteBlog(blog.id, currentUserId || 'default-user');
      message.success('博客删除成功');
      navigate('/blogs');
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <GlassLayout>
        <GlassCard className="p-8" hover={false}>
          <div className="text-center text-white/60">加载中...</div>
        </GlassCard>
      </GlassLayout>
    );
  }

  if (!blog) {
    return (
      <GlassLayout>
        <GlassCard className="p-8" hover={false}>
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-white mb-2">博客不存在</h3>
            <button
              onClick={() => navigate('/blogs')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all mt-4"
            >
              返回列表
            </button>
          </div>
        </GlassCard>
      </GlassLayout>
    );
  }

  const isAuthor = currentUserId && blog.userId === currentUserId;

  return (
    <GlassLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/blogs')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回列表</span>
        </button>

        {/* 封面图片 */}
        {blog.coverImage && (
          <GlassCard className="p-0 overflow-hidden" hover={false}>
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-96 object-cover"
            />
          </GlassCard>
        )}

        {/* 博客内容 */}
        <GlassCard className="p-8" hover={false}>
          {/* 标题 */}
          <h1 className="text-4xl font-bold text-white mb-6">{blog.title}</h1>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-6 mb-6 text-white/60">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{blog.author || '匿名用户'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(blog.createdAt)}</span>
            </div>
            {blog.city && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{blog.city}</span>
              </div>
            )}
          </div>

          {/* 标签 */}
          {blog.tags && (
            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags.split(',').filter(t => t.trim()).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* 内容 */}
          <div
            className="prose prose-invert prose-lg max-w-none text-white/90"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* 统计和操作 */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-all ${
                  liked
                    ? 'text-red-400'
                    : 'text-white/60 hover:text-red-400'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                <span>{blog.likeCount || 0}</span>
              </button>
              <div className="flex items-center gap-2 text-white/60">
                <MessageCircle className="w-5 h-5" />
                <span>{blog.commentCount || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Eye className="w-5 h-5" />
                <span>{blog.viewCount || 0}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                title="分享"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {isAuthor && (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                    title="编辑"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <Popconfirm
                    title="确定要删除这篇博客吗？"
                    onConfirm={handleDelete}
                    okText="确定"
                    cancelText="取消"
                  >
                    <button
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </Popconfirm>
                </>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </GlassLayout>
  );
}
