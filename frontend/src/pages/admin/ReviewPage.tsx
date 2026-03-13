import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  List,
  Card,
  Image,
  Button,
  Popconfirm,
  Input,
  message,
  Pagination,
  Empty,
  Spin,
} from 'antd';
import { getPendingImages, reviewImage } from '../../api/adminApi';
import type { PendingImageItem } from '../../types/admin';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ReviewPage() {
  const [images, setImages] = useState<PendingImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);

  // 加载待审核图片
  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPendingImages(page, pageSize);
      if (response.success && response.data) {
        setImages(response.data.items || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载待审核图片失败:', error);
      message.error('加载待审核图片失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // 通过审核
  const handleApprove = async (imageId: string) => {
    setReviewing(imageId);
    try {
      const response = await reviewImage(imageId, 'approve');
      if (response.success) {
        message.success('审核通过');
        // 乐观更新：从列表中移除
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        setTotal((prev) => prev - 1);
      }
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败');
    } finally {
      setReviewing(null);
    }
  };

  // 拒绝审核
  const handleReject = async (imageId: string) => {
    const note = rejectNote[imageId];
    if (!note || note.trim() === '') {
      message.warning('请输入拒绝原因');
      return;
    }
    setReviewing(imageId);
    try {
      const response = await reviewImage(imageId, 'reject', note);
      if (response.success) {
        message.success('已拒绝');
        // 乐观更新：从列表中移除
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        setTotal((prev) => prev - 1);
        setRejectNote((prev) => {
          const newNotes = { ...prev };
          delete newNotes[imageId];
          return newNotes;
        });
      }
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败');
    } finally {
      setReviewing(null);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          待审核图片
        </Title>
        <Text type="secondary">共 {total} 张待审核</Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : images.length === 0 ? (
        <Empty description="暂无待审核图片" />
      ) : (
        <>
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={images}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  cover={
                    <Image
                      src={item.cloudinaryUrl}
                      style={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                      }}
                      preview={{
                        mask: '点击预览',
                      }}
                    />
                  }
                  actions={[
                    <Button
                      key="approve"
                      type="primary"
                      style={{ background: '#52c41a', borderColor: '#52c41a' }}
                      loading={reviewing === item.id}
                      onClick={() => handleApprove(item.id)}
                    >
                      通过
                    </Button>,
                    <Popconfirm
                      key="reject"
                      title={
                        <div style={{ width: 250 }}>
                          <Text>请输入拒绝原因：</Text>
                          <TextArea
                            rows={3}
                            value={rejectNote[item.id] || ''}
                            onChange={(e) =>
                              setRejectNote((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="拒绝原因（必填）"
                          />
                        </div>
                      }
                      onConfirm={() => handleReject(item.id)}
                      okText="确认拒绝"
                      cancelText="取消"
                      okButtonProps={{
                        disabled: !rejectNote[item.id]?.trim(),
                      }}
                    >
                      <Button danger loading={reviewing === item.id}>
                        拒绝
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    title={<Text strong>{item.spotName}</Text>}
                    description={
                      <div>
                        <div>
                          <Text type="secondary">
                            上传者：{item.uploaderName} ({item.uploaderEmail})
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">
                            上传时间：{formatTime(item.createdAt)}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
              showTotal={(t) => `共 ${t} 条`}
            />
          </div>
        </>
      )}
    </div>
  );
}
