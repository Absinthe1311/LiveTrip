import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Space } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import BlogList from '../components/BlogList';
import BlogDetail from '../components/BlogDetail';
import Navbar from '../components/Navbar';

export default function Blogs() {
  const navigate = useNavigate();
  const [selectedBlogId, setSelectedBlogId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const handleBackToList = () => {
    setSelectedBlogId(undefined);
    setViewMode('list');
  };

  const handleViewBlog = (blogId: string) => {
    setSelectedBlogId(blogId);
    setViewMode('detail');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingTop: '64px' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {viewMode === 'list' ? (
          <>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 600 }}>旅行博客</span>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/blog/create')}
                  >
                    写博客
                  </Button>
                </div>
              }
              style={{ marginBottom: 24 }}
            >
              <div style={{ color: '#666', marginBottom: 16 }}>
                分享你的旅行故事，发现更多精彩旅程
              </div>
            </Card>

            <BlogList onViewBlog={handleViewBlog} />
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBackToList}
              >
                返回博客列表
              </Button>
            </div>

            {selectedBlogId && (
              <BlogDetail
                postId={selectedBlogId}
                onBack={handleBackToList}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}