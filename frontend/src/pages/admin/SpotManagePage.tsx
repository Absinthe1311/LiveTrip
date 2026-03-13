import { useState, useEffect } from 'react';
import {
  Typography,
  Input,
  Table,
  Button,
  Badge,
  Image,
  Modal,
  Tabs,
  Upload,
  message,
  Popconfirm,
  Empty,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAdminSpots, getSpotImages, deleteAdminImage, uploadAdminImage } from '../../api/adminApi';
import type { AdminSpotListItem, SpotImageItem } from '../../types/admin';

const { Title } = Typography;

export default function SpotManagePage() {
  const [spots, setSpots] = useState<AdminSpotListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<AdminSpotListItem | null>(null);
  const [images, setImages] = useState<SpotImageItem[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 加载景点列表
  const loadSpots = async () => {
    setLoading(true);
    try {
      const response = await getAdminSpots(1, 100);
      if (response.success && response.data) {
        // response.data 是 { items, total, page, pageSize }
        setSpots(response.data.items || []);
      }
    } catch (error) {
      console.error('加载景点列表失败:', error);
      message.error('加载景点列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpots();
  }, []);

  // 过滤景点
  const filteredSpots = spots.filter((spot) =>
    spot.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  // 打开图片管理弹窗
  const handleManageImages = async (spot: AdminSpotListItem) => {
    setSelectedSpot(spot);
    setModalVisible(true);
    setImagesLoading(true);
    try {
      const response = await getSpotImages(spot.id);
      if (response.success && response.data) {
        // response.data 是 { approved: [], pending: [], rejected: [] }
        // 将所有图片合并到一个数组，并添加 status 字段
        const allImages: SpotImageItem[] = [
          ...(response.data.approved || []).map((img) => ({ ...img, status: 'approved' as const })),
          ...(response.data.pending || []).map((img) => ({ ...img, status: 'pending' as const })),
          ...(response.data.rejected || []).map((img) => ({ ...img, status: 'rejected' as const })),
        ];
        setImages(allImages);
      }
    } catch (error) {
      console.error('加载图片列表失败:', error);
      message.error('加载图片列表失败');
    } finally {
      setImagesLoading(false);
    }
  };

  // 删除图片
  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await deleteAdminImage(imageId);
      if (response.success) {
        message.success('删除成功');
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      }
    } catch (error) {
      console.error('删除图片失败:', error);
      message.error('删除图片失败');
    }
  };

  // 上传图片
  const handleUpload = async (file: File) => {
    if (!selectedSpot) return;
    setUploading(true);
    try {
      const response = await uploadAdminImage(selectedSpot.id, file);
      if (response.success) {
        message.success('上传成功');
        // 重新加载图片列表
        const imagesResponse = await getSpotImages(selectedSpot.id);
        if (imagesResponse.success && imagesResponse.data) {
          const allImages: SpotImageItem[] = [
            ...(imagesResponse.data.approved || []).map((img) => ({ ...img, status: 'approved' as const })),
            ...(imagesResponse.data.pending || []).map((img) => ({ ...img, status: 'pending' as const })),
            ...(imagesResponse.data.rejected || []).map((img) => ({ ...img, status: 'rejected' as const })),
          ];
          setImages(allImages);
        }
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      message.error('上传图片失败');
    } finally {
      setUploading(false);
    }
  };

  // 表格列定义
  const columns: ColumnsType<AdminSpotListItem> = [
    {
      title: '景点名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
    },
    {
      title: '已审核图片',
      dataIndex: 'approvedImageCount',
      key: 'approvedImageCount',
      width: 120,
      render: (count: number) => (
        <Badge count={count} showZero color="#52c41a" />
      ),
    },
    {
      title: '待审核图片',
      dataIndex: 'pendingImageCount',
      key: 'pendingImageCount',
      width: 120,
      render: (count: number) =>
        count > 0 ? <Badge count={count} color="#faad14" /> : null,
    },
    {
      title: '封面图',
      dataIndex: 'coverImageUrl',
      key: 'coverImageUrl',
      width: 100,
      render: (url: string | null) =>
        url ? (
          <Image src={url} width={60} height={40} style={{ objectFit: 'cover' }} />
        ) : (
          <span style={{ color: '#999' }}>暂无图片</span>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => handleManageImages(record)}>
          管理图片
        </Button>
      ),
    },
  ];

  // 按状态分组图片
  const approvedImages = images.filter((img) => img.status === 'approved');
  const pendingImages = images.filter((img) => img.status === 'pending');
  const rejectedImages = images.filter((img) => img.status === 'rejected');

  // 渲染图片网格
  const renderImageGrid = (imageList: SpotImageItem[], showDelete: boolean = false) => {
    if (imageList.length === 0) {
      return <Empty description="暂无图片" />;
    }
    return (
      <Image.PreviewGroup>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {imageList.map((img) => (
            <div
              key={img.id}
              style={{
                width: 200,
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                padding: 8,
              }}
            >
              <Image
                src={img.cloudinaryUrl}
                width={184}
                height={120}
                style={{ objectFit: 'cover', borderRadius: 4 }}
              />
              {showDelete && (
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <Popconfirm
                    title="确认删除此图片？"
                    onConfirm={() => handleDeleteImage(img.id)}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                </div>
              )}
              {!showDelete && (
                <div style={{ marginTop: 8, textAlign: 'center', color: '#999', fontSize: 12 }}>
                  {img.uploaderName && `上传者: ${img.uploaderName}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </Image.PreviewGroup>
    );
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          景点图片管理
        </Title>
        <Input
          placeholder="搜索景点名称"
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: 200 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredSpots}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 图片管理弹窗 */}
      <Modal
        title={`${selectedSpot?.name || ''} - 图片管理`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedSpot(null);
          setImages([]);
        }}
        footer={null}
        width={800}
      >
        {imagesLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <Tabs
            items={[
              {
                key: 'approved',
                label: `已审核 (${approvedImages.length})`,
                children: (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={(file) => {
                          handleUpload(file);
                          return false;
                        }}
                      >
                        <Button icon={<UploadOutlined />} loading={uploading}>
                          上传新图片
                        </Button>
                      </Upload>
                    </div>
                    {renderImageGrid(approvedImages, true)}
                  </div>
                ),
              },
              {
                key: 'pending',
                label: `待审核 (${pendingImages.length})`,
                children: renderImageGrid(pendingImages),
              },
              {
                key: 'rejected',
                label: `已拒绝 (${rejectedImages.length})`,
                children: renderImageGrid(rejectedImages),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
