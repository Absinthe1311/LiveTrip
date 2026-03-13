/**
 * 评价路由
 * 处理评价相关的API路由
 */

import express from 'express';
import { ReviewController } from '../controllers/reviewController';

const router = express.Router();

/**
 * 创建评价
 * POST /reviews
 */
router.post('/', ReviewController.createReview);

/**
 * 获取景点的所有评价
 * GET /reviews/spot/:spotId
 */
router.get('/spot/:spotId', ReviewController.getSpotReviews);

/**
 * 获取用户的评价
 * GET /reviews/user/:userId
 */
router.get('/user/:userId', ReviewController.getUserReviews);

/**
 * 删除评价
 * DELETE /reviews/:reviewId
 */
router.delete('/:reviewId', ReviewController.deleteReview);

/**
 * 点赞/取消点赞
 * POST /reviews/:reviewId/like
 */
router.post('/:reviewId/like', ReviewController.toggleLike);

/**
 * 批量获取景点的评价统计
 * POST /reviews/stats
 */
router.post('/stats', ReviewController.getSpotReviewsStats);

export default router;