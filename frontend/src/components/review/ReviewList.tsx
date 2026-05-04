/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */
﻿import { useState, useEffect } from 'react';
import { Card, Rate, Avatar, List, Button, Empty, Image, Spin, Tag, Pagination, Modal } from 'antd';
import {
  UserOutlined,
  StarFilled,
  EditOutlined,
  DeleteOutlined,
  LikeOutlined,
  LikeFilled,
} from '@ant-design/icons';
import { getSpotReviews, deleteReview, toggleReviewLike } from '../../api/client';
import ReviewForm from '../review/ReviewForm';

interface ReviewListProps {
  spotId: string;
  spotName: string;
  userId?: string;
}

export default function ReviewList({ spotId, spotName, userId = 'default-user' }: ReviewListProps) {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});
  const [reviewFormVisible, setReviewFormVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const loadReviews = async (pageNum: number = page) => {
    try {
      setLoading(true);
      const response = await getSpotReviews(spotId, pageNum, pageSize);

      if (response.success) {
        setReviews(response.data.reviews);
        setTotal(response.data.total);
        setAverageRating(response.data.averageRating);
        setRatingDistribution(response.data.ratingDistribution);
      }
    } catch (error: any) {
      console.error('加载评价失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [spotId, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId, userId);
      setDeleteConfirmVisible(false);
      setDeletingReviewId(null);
      loadReviews(page);
    } catch (error: any) {
      console.error('删除评价失败:', error);
    }
  };

  const handleReviewSuccess = () => {
    setReviewFormVisible(false);
    loadReviews(page);
  };

  const handleToggleLike = async (reviewId: string) => {
    try {
      await toggleReviewLike(reviewId, userId);
      loadReviews(page);
    } catch (error: any) {
      console.error('点赞失败:', error);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#52c41a';
    if (rating >= 3) return '#faad14';
    return '#ff4d4f';
  };

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div key={rating} style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <Rate disabled defaultValue={rating} count={1} style={{ fontSize: 14, marginRight: 8 }} />
          <span style={{ fontSize: 12, color: '#666' }}>{rating}星</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              height: 8,
              backgroundColor: '#f0f0f0',
              borderRadius: 4,
              marginRight: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: getRatingColor(rating),
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#999', minWidth: 40, textAlign: 'right' }}>
            {count}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 评价统计 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          {/* 平均评分 */}
          <div style={{ flex: 1, textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#faad14', marginBottom: 8 }}>
              {averageRating ? averageRating.toFixed(1) : '-'}
            </div>
            <div style={{ color: '#666', marginBottom: 8 }}>平均评分</div>
            <Rate disabled defaultValue={averageRating || 0} allowHalf style={{ fontSize: 16 }} />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{total} 条评价</div>
          </div>

          {/* 评分分布 */}
          <div style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map((rating) =>
              renderRatingBar(rating, ratingDistribution[rating] || 0, total)
            )}
          </div>
        </div>

        {/* 写评价按钮 */}
        <Button
          type="primary"
          block
          onClick={() => setReviewFormVisible(true)}
          style={{ marginTop: 16 }}
        >
          写评价
        </Button>
      </Card>

      {/* 评价列表 */}
      <Card title="用户评价">
        <Spin spinning={loading}>
          {reviews.length === 0 ? (
            <Empty description="暂无评价，快来抢沙发吧！" />
          ) : (
            <>
              <List
                dataSource={reviews}
                renderItem={(review: any) => (
                  <List.Item key={review.id}>
                    <div style={{ width: '100%' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>
                              {review.userId === userId ? '我' : `用户${review.userId.slice(-4)}`}
                            </div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Rate disabled defaultValue={review.rating} style={{ fontSize: 14 }} />
                          <Button
                            type="text"
                            icon={review.liked ? <LikeFilled /> : <LikeOutlined />}
                            size="small"
                            onClick={() => handleToggleLike(review.id)}
                            style={{ color: review.liked ? '#ff4d4f' : 'inherit' }}
                          >
                            {review.likeCount || 0}
                          </Button>
                          {review.userId === userId && (
                            <>
                              <Button
                                type="text"
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => setReviewFormVisible(true)}
                              />
                              <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                size="small"
                                danger
                                onClick={() => {
                                  setDeletingReviewId(review.id);
                                  setDeleteConfirmVisible(true);
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <div
                        style={{ fontSize: 14, color: '#666', lineHeight: '1.6', marginBottom: 12 }}
                      >
                        {review.comment}
                      </div>

                      {review.images && review.images.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {review.images.map((image: any) => (
                            <Image
                              key={image.id}
                              src={image.imageUrl}
                              alt={image.altText}
                              style={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 8,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
              />

              {total > pageSize && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
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

      {/* 评价表单 */}
      <ReviewForm
        visible={reviewFormVisible}
        spotId={spotId}
        spotName={spotName}
        userId={userId}
        onCancel={() => setReviewFormVisible(false)}
        onSuccess={handleReviewSuccess}
      />

      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        open={deleteConfirmVisible}
        onOk={() => deletingReviewId && handleDeleteReview(deletingReviewId)}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setDeletingReviewId(null);
        }}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除这条评价吗？删除后无法恢复。</p>
      </Modal>
    </div>
  );
}
