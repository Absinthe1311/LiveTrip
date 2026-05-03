import { useState, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Avatar,
  Button,
  Empty,
  Image,
  Spin,
  Pagination,
  Space,
  Dropdown,
  Menu,
} from 'antd';
import {
  UserOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { getBlogPosts, toggleLike, deleteBlog } from '../../api/client';
import BlogEditor from './BlogEditor';

interface BlogListProps {
  userId?: string;
  city?: string;
  tags?: string[];
  sortBy?: 'latest' | 'popular' | 'mostLiked';
  onViewBlog?: (blogId: string) => void;
}

export default function BlogList({
  userId,
  city,
  tags,
  sortBy = 'latest',
  onViewBlog,
}: BlogListProps) {
  const [loading, setLoading] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'latest' | 'popular' | 'mostLiked'>(sortBy);

  const loadBlogs = async (pageNum: number = page) => {
    try {
      setLoading(true);
      const response = await getBlogPosts({
        userId,
        city,
        tags,
        isPublished: true,
        page: pageNum,
        pageSize,
        sortBy: sortOrder,
      });

      if (response.success) {
        setBlogs(response.data.posts);
        setTotal(response.data.total);
      }
    } catch (error: any) {
      console.error('加载博客失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, [userId, city, tags, sortOrder]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSortChange = (value: 'latest' | 'popular' | 'mostLiked') => {
    setSortOrder(value);
    setPage(1);
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await toggleLike(postId, userId || 'default-user');
      loadBlogs(page);
    } catch (error: any) {
      console.error('点赞失败:', error);
    }
  };

  const handleEditBlog = (postId: string) => {
    setEditingPostId(postId);
    setEditorVisible(true);
  };

  const handleDeleteBlog = async (postId: string) => {
    try {
      await deleteBlog(postId, userId || 'default-user');
      loadBlogs(page);
    } catch (error: any) {
      console.error('删除博客失败:', error);
    }
  };

  const handleCreateBlog = () => {
    setEditingPostId(undefined);
    setEditorVisible(true);
  };

  const handleBlogSuccess = () => {
    setEditorVisible(false);
    setEditingPostId(undefined);
    loadBlogs(page);
  };

  const sortMenuItems = [
    {
      key: 'latest',
      label: '最新发布',
      onClick: () => handleSortChange('latest'),
      style: { fontWeight: sortOrder === 'latest' ? 'bold' : 'normal' },
    },
    {
      key: 'popular',
      label: '最多浏览',
      onClick: () => handleSortChange('popular'),
      style: { fontWeight: sortOrder === 'popular' ? 'bold' : 'normal' },
    },
    {
      key: 'mostLiked',
      label: '最多点赞',
      onClick: () => handleSortChange('mostLiked'),
      style: { fontWeight: sortOrder === 'mostLiked' ? 'bold' : 'normal' },
    },
  ];

  const getMoreMenuItems = (blog: any) => {
    const items = [];
    if (blog.userId === userId) {
      items.push(
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: '编辑',
          onClick: () => handleEditBlog(blog.id),
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: '删除',
          danger: true,
          onClick: () => handleDeleteBlog(blog.id),
        }
      );
    }
    return items;
  };

  return (
    <div>
      <Card
        title="旅行博客"
        extra={
          <Space>
            <Dropdown menu={{ items: sortMenuItems }} trigger={['click']}>
              <Button>
                {sortOrder === 'latest'
                  ? '最新发布'
                  : sortOrder === 'popular'
                    ? '最多浏览'
                    : '最多点赞'}
              </Button>
            </Dropdown>
            <Button type="primary" onClick={handleCreateBlog}>
              写博客
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {blogs.length === 0 ? (
            <Empty description="暂无博客，快来分享你的旅行故事吧！" />
          ) : (
            <>
              <List
                dataSource={blogs}
                renderItem={(blog: any) => (
                  <List.Item key={blog.id}>
                    <Card
                      hoverable
                      style={{ width: '100%' }}
                      onClick={() => onViewBlog && onViewBlog(blog.id)}
                      cover={
                        blog.coverImage && (
                          <div style={{ height: 240, overflow: 'hidden' }}>
                            <Image
                              src={blog.coverImage}
                              alt={blog.title}
                              preview={false}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </div>
                        )
                      }
                    >
                      <Card.Meta
                        avatar={
                          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                        }
                        title={
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ fontSize: 18, fontWeight: 600 }}>{blog.title}</span>
                            <Dropdown menu={{ items: getMoreMenuItems(blog) }} trigger={['click']}>
                              <Button type="text" icon={<MoreOutlined />} />
                            </Dropdown>
                          </div>
                        }
                        description={
                          <div>
                            <div style={{ color: '#666', marginBottom: 8 }}>
                              {blog.userId === userId ? '我' : `用户${blog.userId.slice(-4)}`} ·{' '}
                              {blog.city || '未知城市'}
                            </div>
                            <div style={{ color: '#888', lineHeight: '1.6', marginBottom: 12 }}>
                              {blog.content.length > 200
                                ? blog.content.slice(0, 200) + '...'
                                : blog.content}
                            </div>
                            {blog.tags && (
                              <div style={{ marginBottom: 12 }}>
                                {blog.tags.split(',').map((tag: string, index: number) => (
                                  <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                                    {tag.trim()}
                                  </Tag>
                                ))}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 16, color: '#999', fontSize: 12 }}>
                              <Space size={4}>
                                <EyeOutlined />
                                <span>{blog.viewCount}</span>
                              </Space>
                              <Space size={4}>
                                <LikeOutlined
                                  style={{
                                    color: blog.likes?.some((l: any) => l.userId === userId)
                                      ? '#ff4d4f'
                                      : 'inherit',
                                  }}
                                />
                                <span>{blog.likeCount}</span>
                              </Space>
                              <Space size={4}>
                                <MessageOutlined />
                                <span>{blog.commentCount}</span>
                              </Space>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />

              {total > pageSize && (
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <Pagination
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          )}
        </Spin>
      </Card>

      {/* 博客编辑器 */}
      {editorVisible && <BlogEditor postId={editingPostId} userId={userId} />}
    </div>
  );
}
