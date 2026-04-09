import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Table, Tag, Space, Upload, Modal, Image, message, Select, Input } from 'antd';
import { UploadOutlined, CameraOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { adminImageClient } from '../api/adminImageClient';
import AdminNavbar from '../components/AdminNavbar';

interface SpotImageStatus {
  id: string;
  name: string;
  city: string;
  rating: number;
  viewCount: number;
  imageCount: number;
  approvedCount: number;
  hasPrimary: boolean;
  status: 'has-image' | 'no-image' | 'pending';
  isFromUserTrip: boolean;
}

interface DashboardStats {
  totalSpots: number;
  hasImage: number;
  noImage: number;
  pending: number;
  fromUserTrip: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSpots: 0,
    hasImage: 0,
    noImage: 0,
    pending: 0,
    fromUserTrip: 0,
  });
  const [spots, setSpots] = useState<SpotImageStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<SpotImageStatus | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await adminImageClient.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      message.error('加载统计数据失败');
    }
  };

  // 加载景点列表
  const loadSpots = async () => {
    setLoading(true);
    try {
      const response = await adminImageClient.getSpotImageStatus({
        status: filterStatus,
        keyword: searchKeyword,
        city: selectedCity === 'all' ? undefined : selectedCity,
        page: 1,
        limit: 20,
      });
      if (response.success) {
        setSpots(response.data);
      }
    } catch (error) {
      console.error('加载景点列表失败:', error);
      message.error('加载景点列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadSpots();
  }, [filterStatus, searchKeyword, selectedCity]);

  // 打开上传模态框
  const handleUpload = (spot: SpotImageStatus) => {
    setSelectedSpot(spot);
    setUploadModalVisible(true);
  };

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'images',
    multiple: true,
    accept: 'image/*',
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      if (!selectedSpot) {
        onError?.(new Error('未选择景点'));
        return;
      }

      const formData = new FormData();
      formData.append('images', file as File);

      try {
        const response = await adminImageClient.uploadSpotImage(selectedSpot.id, formData);
        if (response.success) {
          message.success('图片上传成功');
          onSuccess?.(response);
          loadSpots();
          loadStats();
        } else {
          message.error(response.error || '上传失败');
          onError?.(new Error(response.error || '上传失败'));
        }
      } catch (error) {
        console.error('上传失败:', error);
        message.error('上传失败');
        onError?.(error as Error);
      }
    },
  };

  // 状态标签渲染
  const renderStatusTag = (status: string, isFromUserTrip: boolean) => {
    if (isFromUserTrip) {
      return <Tag color="blue">用户行程景点</Tag>;
    }
    switch (status) {
      case 'has-image':
        return <Tag color="success">已配图</Tag>;
      case 'no-image':
        return <Tag color="error">未配图</Tag>;
      case 'pending':
        return <Tag color="warning">待审核</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '景点名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: SpotImageStatus) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.city}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: SpotImageStatus) => renderStatusTag(status, record.isFromUserTrip),
    },
    {
      title: '图片数量',
      dataIndex: 'imageCount',
      key: 'imageCount',
      render: (count: number, record: SpotImageStatus) => (
        <div>
          <div>总数: {count}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>已审核: {record.approvedCount}</div>
        </div>
      ),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => rating ? rating.toFixed(1) : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SpotImageStatus) => (
        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            size="small"
            onClick={() => handleUpload(record)}
          >
            上传图片
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      <AdminNavbar />
      <div style={{ padding: '96px 24px 24px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            📸 LiveTrip 图片管理系统
          </h1>
          <p style={{ color: '#666' }}>管理员专属界面 - 景点图片配图管理</p>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总景点数"
                value={stats.totalSpots}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已配图"
                value={stats.hasImage}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="未配图"
                value={stats.noImage}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="用户行程景点"
                value={stats.fromUserTrip}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选器 */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Select
                style={{ width: '100%' }}
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { label: '全部状态', value: 'all' },
                  { label: '已配图', value: 'has-image' },
                  { label: '未配图', value: 'no-image' },
                  { label: '待审核', value: 'pending' },
                  { label: '用户行程景点', value: 'from-user-trip' },
                ]}
              />
            </Col>
            <Col span={6}>
              <Input
                placeholder="搜索景点名称"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Input
                placeholder="输入城市名称"
                value={selectedCity === 'all' ? '' : selectedCity}
                onChange={(e) => setSelectedCity(e.target.value || 'all')}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadSpots}
                loading={loading}
              >
                刷新
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 景点列表 */}
        <Card>
          <Table
            columns={columns}
            dataSource={spots}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </Card>

        {/* 上传模态框 */}
        <Modal
          title={`上传图片 - ${selectedSpot?.name}`}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
          footer={null}
          width={600}
        >
          <div style={{ padding: '24px 0' }}>
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <CameraOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
              <p className="ant-upload-hint">支持批量上传，管理员上传的图片将自动审核通过</p>
            </Upload.Dragger>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminDashboard;
