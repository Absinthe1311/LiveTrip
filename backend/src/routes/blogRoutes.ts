/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：路由重构
 */

/**
 * Blog路由
 * 处理博客相关的API路由
 */

import express from 'express';
import { BlogController } from '../controllers/blogController';

const router = express.Router();

/**
 * 创建博客文章
 * POST /blogs
 */
router.post('/', BlogController.createBlog);

/**
 * 获取博客文章列表
 * GET /blogs
 */
router.get('/', BlogController.getBlogPosts);

/**
 * 获取博客文章详情
 * GET /blogs/:id
 */
router.get('/:id', BlogController.getBlogPostById);

/**
 * 增加博客浏览量
 * POST /blogs/:id/view
 */
router.post('/:id/view', BlogController.incrementViewCount);

/**
 * 更新博客文章
 * PUT /blogs/:id
 */
router.put('/:id', BlogController.updateBlog);

/**
 * 删除博客文章
 * DELETE /blogs/:id
 */
router.delete('/:id', BlogController.deleteBlog);

/**
 * 点赞/取消点赞
 * POST /blogs/:postId/like
 */
router.post('/:postId/like', BlogController.toggleLike);

/**
 * 添加评论
 * POST /blogs/:postId/comments
 */
router.post('/:postId/comments', BlogController.addComment);

/**
 * 删除评论
 * DELETE /blogs/comments/:commentId
 */
router.delete('/comments/:commentId', BlogController.deleteComment);

/**
 * 点赞/取消点赞评论
 * POST /blogs/comments/:commentId/like
 */
router.post('/comments/:commentId/like', BlogController.toggleCommentLike);

/**
 * 获取热门标签
 * GET /blogs/tags/popular
 */
router.get('/tags/popular', BlogController.getPopularTags);

export default router;
