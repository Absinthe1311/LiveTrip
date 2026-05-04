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
router.post('/', BlogController.addBlog);

/**
 * 获取博客文章列表
 * GET /blogs
 */
router.get('/', BlogController.fetchPosts);

/**
 * 获取博客文章详情
 * GET /blogs/:id
 */
router.get('/:id', BlogController.loadBlogId);

/**
 * 增加博客浏览量
 * POST /blogs/:id/view
 */
router.post('/:id/view', BlogController.incViews);

/**
 * 更新博客文章
 * PUT /blogs/:id
 */
router.put('/:id', BlogController.updBlog);

/**
 * 删除博客文章
 * DELETE /blogs/:id
 */
router.delete('/:id', BlogController.delBlog);

/**
 * 点赞/取消点赞
 * POST /blogs/:postId/like
 */
router.post('/:postId/like', BlogController.blogLike);

/**
 * 添加评论
 * POST /blogs/:postId/comments
 */
router.post('/:postId/comments', BlogController.addCmt);

/**
 * 删除评论
 * DELETE /blogs/comments/:commentId
 */
router.delete('/comments/:commentId', BlogController.delCmt);

/**
 * 点赞/取消点赞评论
 * POST /blogs/comments/:commentId/like
 */
router.post('/comments/:commentId/like', BlogController.likeCmt);

/**
 * 获取热门标签
 * GET /blogs/tags/popular
 */
router.get('/tags/popular', BlogController.hotTags);

export default router;
