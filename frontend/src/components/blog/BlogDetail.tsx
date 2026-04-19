import { useState, useEffect, useRef } from 'react';
import { Card, Avatar, Button, Tag, Image, Empty, Spin, Space, Divider, List, message } from 'antd';
import { UserOutlined, LikeFilled, LikeOutlined, MessageOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getBlogPostById, toggleLike, deleteBlog, addBlogComment, deleteBlogComment, toggleBlogCommentLike, incrementBlogViewCount } from '../../api/client';
import { calculateWordCount, calculateReadingTime, formatReadingTime } from '../../utils/blogContentUtils';

interface BlogDetailProps {
  postId: string;
  userId?: string;
  onBack: () => void;
}

export default function BlogDetail({ postId, userId = 'default-user', onBack }: BlogDetailProps) {
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState<any>(null);
  const [commentInput, setCommentInput] = useState('');
  const hasIncrementedView = useRef(false);

  const loadBlog = async () => {
    try {
      setLoading(true);
      const response = await getBlogPostById(postId);
      
      if (response.success && response.data) {
        setBlog(response.data);
      }
    } catch (error: any) {
      message.error('加载博客失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlog();
    
    // 只在初次加载时增加浏览量
    if (!hasIncrementedView.current) {
      incrementBlogViewCount(postId);
      hasIncrementedView.current = true;
    }
  }, [postId]);

  const handleToggleLike = async () => {
    try {
      await toggleLike(postId, userId);
      loadBlog();
    } catch (error: any) {
      message.error('点赞失败');
    }
  };

  const handleDeleteBlog = async () => {
    try {
      await deleteBlog(postId, userId);
      message.success('博客删除成功');
      onBack();
    } catch (error: any) {
      message.error('删除博客失败');
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    try {
      await addBlogComment(postId, userId, commentInput);
      setCommentInput('');
      loadBlog();
    } catch (error: any) {
      message.error('评论失败');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteBlogComment(commentId, userId);
      loadBlog();
    } catch (error: any) {
      message.error('删除评论失败');
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    try {
      await toggleBlogCommentLike(commentId, userId);
      loadBlog();
    } catch (error: any) {
      message.error('点赞失败');
    }
  };

  // 计算是否已点赞评论
  const isCommentLiked = (comment: any) => {
    return comment.likes?.some((like: any) => like.userId === userId);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={{ padding: 40 }}>
        <Empty description="博客不存在" />
      </div>
    );
  }

  const isLiked = blog.likes?.some((l: any) => l.userId === userId);
  const isAuthor = blog.userId === userId;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card>
        {/* 标题和操作栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{blog.title}</h1>
          <Space>
            {isAuthor && (
              <>
                <Button icon={<EditOutlined />}>编辑</Button>
                <Button danger icon={<DeleteOutlined />} onClick={handleDeleteBlog}>
                  删除
                </Button>
              </>
            )}
          </Space>
        </div>

        {/* 作者信息 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff', marginRight: 12 }}
            size={40}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>
              {isAuthor ? '我' : `用户${blog.userId.slice(-4)}`}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('zh-CN')}
              {blog.city && ` · ${blog.city}`}
            </div>
          </div>
        </div>

        {/* 标签 */}
        {blog.tags && (
          <div style={{ marginBottom: 16 }}>
            {blog.tags.split(',').map((tag: string, index: number) => (
              <Tag key={index} color="blue">
                {tag.trim()}
              </Tag>
            ))}
          </div>
        )}

        {/* 封面图 */}
        {blog.coverImage && (
          <div style={{ marginBottom: 24 }}>
            <Image
              src={blog.coverImage}
              alt={blog.title}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
        )}

        {/* 内容 */}
        <div
          className="prose prose-lg max-w-none"
          style={{
            fontSize: 16,
            lineHeight: '1.8',
            color: '#333',
            marginBottom: 24,
          }}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        <Divider />

        {/* 社交互动栏 */}
        <div style={{ display: 'flex', gap: 24, padding: '16px 0' }}>
          <Button
            type={isLiked ? 'primary' : 'default'}
            icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
            onClick={handleToggleLike}
            size="large"
          >
            {blog.likeCount}
          </Button>
          <Button
            icon={<MessageOutlined />}
            size="large"
          >
            {blog.commentCount}
          </Button>
          <div style={{ marginLeft: 'auto', color: '#999', fontSize: 14 }}>
            <Space size={16}>
              <span>浏览 {blog.viewCount}</span>
              <span>字数 {calculateWordCount(blog.content)}</span>
              <span>阅读 {formatReadingTime(calculateReadingTime(calculateWordCount(blog.content)))}</span>
            </Space>
          </div>
        </div>

        <Divider />

        {/* 评论区域 */}
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>评论 ({blog.commentCount})</h3>

          {/* 评论输入框 */}
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="写下你的评论..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddComment();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                />
                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    onClick={handleAddComment}
                    disabled={!commentInput.trim()}
                  >
                    发表评论
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 评论列表 */}
          {blog.comments && blog.comments.length > 0 ? (
            <List
              dataSource={blog.comments}
              renderItem={(comment: any) => (
                <List.Item key={comment.id}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          {comment.userId === userId ? '我' : `用户${comment.userId.slice(-4)}`}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Button
                            type="text"
                            size="small"
                            icon={isCommentLiked(comment) ? <LikeFilled /> : <LikeOutlined />}
                            onClick={() => handleToggleCommentLike(comment.id)}
                            style={{ color: isCommentLiked(comment) ? '#ff4d4f' : 'inherit', padding: '0 4px' }}
                          >
                            {comment.likeCount || 0}
                          </Button>
                          <span style={{ fontSize: 12, color: '#999' }}>
                            {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                          {comment.userId === userId && (
                            <Button
                              type="text"
                              size="small"
                              danger
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              删除
                            </Button>
                          )}
                        </div>
                      </div>
                    }
                    description={
                      <div style={{ color: '#333', fontSize: 14, marginTop: 8 }}>
                        {comment.content}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无评论，快来抢沙发吧！" />
          )}
        </div>
      </Card>
    </div>
  );
}


