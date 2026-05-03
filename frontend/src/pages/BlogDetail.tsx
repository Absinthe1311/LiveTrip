// Blog详情页面 - 毛玻璃风格

// AI辅助生成：GLM-4, 2026-4-21
// 删除博客详情页搜索栏：
// 1. 将所有GlassLayout组件添加showSearch={false}属性
// 2. 包括加载状态、错误状态和正常显示状态

// 人工修复：GLM-4, 2026-4-21
// 修复问题：无编译错误，代码直接可用
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Eye,
  Download,
  Calendar,
  User,
  Tag,
  MapPin,
  Edit2,
  Trash2,
} from 'lucide-react';
import GlassLayout from '../components/layout/GlassLayout';
import { GlassCard } from '../components/home';
import {
  getBlogPostById,
  deleteBlog,
  toggleLike,
  incrementBlogViewCount,
  addBlogComment,
  deleteBlogComment,
} from '../api/client';
import { message, Popconfirm } from 'antd';
import { exportBlogToPDF } from '../utils/exportPDF';

interface BlogDetail {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  tags?: string;
  city?: string;
  userId?: string;
  author?: {
    id: string;
    username: string;
    avatar?: string;
    nickname?: string;
  };
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  isPublished?: boolean;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    user?: {
      id: string;
      username: string;
      avatar?: string;
      nickname?: string;
    };
  }>;
}

export default function BlogDetailGlass() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const hasIncrementedView = useRef(false);

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

        // 增加浏览量（只执行一次）
        if (!hasIncrementedView.current) {
          hasIncrementedView.current = true;
          await incrementBlogViewCount(blogId);
        }
      }
    } catch (error) {
      message.error('加载博客详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!blog || !currentUserId) {
      message.warning('请先登录');
      return;
    }
    try {
      const response = await toggleLike(blog.id, currentUserId);
      if (response.success && response.data) {
        setLiked(response.data.liked);
        setBlog({
          ...blog,
          likeCount: response.data.likeCount,
        });
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAddComment = async () => {
    if (!blog || !currentUserId) {
      message.warning('请先登录');
      return;
    }
    if (!commentText.trim()) {
      message.warning('请输入评论内容');
      return;
    }
    try {
      const response = await addBlogComment(blog.id, currentUserId, commentText);
      if (response.success && response.data) {
        message.success('评论成功');
        setCommentText('');
        // 重新加载博客详情以获取最新评论
        loadBlogDetail(blog.id);
      }
    } catch (error) {
      message.error('评论失败');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) {
      message.warning('请先登录');
      return;
    }
    try {
      const response = await deleteBlogComment(commentId, currentUserId);
      if (response.success) {
        message.success('删除评论成功');
        // 重新加载博客详情
        if (blog) {
          loadBlogDetail(blog.id);
        }
      }
    } catch (error) {
      message.error('删除评论失败');
    }
  };

  const handleEdit = () => {
    if (!blog) return;
    navigate(`/blog/edit?id=${blog.id}`);
  };

  const handleDelete = async () => {
    if (!blog) return;
    try {
      const response = await deleteBlog(blog.id, currentUserId || 'default-user');
      if (response.success) {
        message.success('博客删除成功');
        // 使用 replace 而不是 push，避免回退到已删除的页面
        navigate('/blogs', { replace: true });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleExportPDF = async () => {
    if (!blog) return;

    try {
      message.loading({ content: '正在生成PDF...', key: 'pdf' });

      const authorName = blog.author?.nickname || blog.author?.username || '匿名用户';
      const dateStr = new Date(blog.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await exportBlogToPDF(blog.title, blog.content, authorName, dateStr, blog.city);

      message.success({ content: 'PDF导出成功！', key: 'pdf' });
    } catch (error) {
      message.error({ content: 'PDF导出失败，请重试', key: 'pdf' });
      console.error('PDF导出错误:', error);
    }
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
      <GlassLayout showSearch={false}>
        <GlassCard className="p-8" hover={false}>
          <div className="text-center text-white/60">加载中...</div>
        </GlassCard>
      </GlassLayout>
    );
  }

  if (!blog) {
    return (
      <GlassLayout showSearch={false}>
        <GlassCard className="p-8" hover={false}>
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-white mb-2">博客不存在</h3>
            <button
              onClick={() => navigate('/blogs')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#CDEDDE] to-[#CDEDDE]/80 text-[#005746] font-semibold hover:shadow-lg hover:shadow-[#CDEDDE]/40 transition-all mt-4 border border-[#CDEDDE]/50"
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
    <GlassLayout showSearch={false}>
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
            <img src={blog.coverImage} alt={blog.title} className="w-full h-96 object-cover" />
          </GlassCard>
        )}

        {/* 博客内容 */}
        <GlassCard className="p-8" hover={false}>
          {/* 标题 */}
          <h1 className="text-4xl font-bold text-white mb-6">{blog.title}</h1>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-6 mb-6 text-white/60">
            <div className="flex items-center gap-2">
              {blog.author?.avatar ? (
                <img src={blog.author.avatar} alt="avatar" className="w-5 h-5 rounded-full" />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span>{blog.author?.nickname || blog.author?.username || '匿名用户'}</span>
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
              {blog.tags
                .split(',')
                .filter((t) => t.trim())
                .map((tag, idx) => (
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
                  liked ? 'text-red-400' : 'text-white/60 hover:text-red-400'
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
                onClick={handleExportPDF}
                className="p-2 rounded-lg bg-white/5 hover:bg-[#CDEDDE]/20 text-white/70 hover:text-[#CDEDDE] transition-all border border-transparent hover:border-[#145F39]/30"
                title="导出PDF"
              >
                <Download className="w-5 h-5" />
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

        {/* 评论区 */}
        <GlassCard className="p-8" hover={false}>
          <h2 className="text-2xl font-bold text-white mb-6">评论 ({blog.commentCount || 0})</h2>

          {/* 评论输入框 */}
          {currentUserId && (
            <div className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的评论..."
                className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50 resize-none"
                rows={3}
              />
              <button
                onClick={handleAddComment}
                className="mt-3 px-6 py-2 rounded-lg bg-gradient-to-r from-[#CDEDDE] to-[#CDEDDE]/80 text-[#005746] font-semibold hover:shadow-lg hover:shadow-[#CDEDDE]/40 transition-all border border-[#CDEDDE]/50"
              >
                发表评论
              </button>
            </div>
          )}

          {/* 评论列表 */}
          {blog.comments && blog.comments.length > 0 ? (
            <div className="space-y-4">
              {blog.comments.map((comment) => (
                <div key={comment.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {comment.user?.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt="avatar"
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#145F39]/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-[#145F39]" />
                        </div>
                      )}
                      <div>
                        <div className="text-white font-semibold">
                          {comment.user?.nickname || comment.user?.username || '匿名用户'}
                        </div>
                        <div className="text-white/40 text-sm">
                          {new Date(comment.createdAt).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    {currentUserId && comment.userId === currentUserId && (
                      <Popconfirm
                        title="确定要删除这条评论吗？"
                        onConfirm={() => handleDeleteComment(comment.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <button className="text-red-400 hover:text-red-300 text-sm">删除</button>
                      </Popconfirm>
                    )}
                  </div>
                  <div className="mt-3 text-white/80">{comment.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-white/40 py-8">暂无评论，快来发表第一条评论吧！</div>
          )}
        </GlassCard>
      </div>
    </GlassLayout>
  );
}
