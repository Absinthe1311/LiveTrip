import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import BlogEditor from '../components/BlogEditor';
import Navbar from '../components/Navbar';

export default function CreateBlog() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/blogs');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingTop: '64px' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/blogs')}
          >
            返回博客列表
          </Button>
        </div>

        <Card
          title="创建新的旅行博客"
          style={{ maxWidth: 900, margin: '0 auto' }}
        >
          <BlogEditor
            visible={true}
            onCancel={() => navigate('/blogs')}
            onSuccess={handleSuccess}
          />
        </Card>
      </div>
    </div>
  );
}