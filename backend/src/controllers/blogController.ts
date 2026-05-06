/**
 * Blog控制器
 * 处理博客相关的API请求
 */

import { Request, Response } from 'express';

import { blogService } from '../services/blogService';

export class BlogController {
  /**
   * 创建博客文章
   */
  static async addBlog(req: Request, res: Response): Promise<void> {
    try {
      const { userId, title, content, coverImage, tags, city, spotIds, isPublished } = req.body;

      if (!userId || !title || !content) {
        res.status(400).json({
          success: false,
          message: '缺少必填字段：userId、title、content',
        });
        return;
      }

      const blog = await blogService.newBlog({
        userId,
        title,
        content,
        coverImage,
        tags,
        city,
        spotIds,
        isPublished,
      });

      res.status(201).json({
        success: true,
        message: '博客文章创建成功',
        data: blog,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '创建博客文章失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取博客文章列表
   */
  static async fetchPosts(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        city,
        tags,
        isPublished,
        page = '1',
        pageSize = '10',
        sortBy = 'latest',
      } = req.query;

      const params: any = {};
      if (userId) params.userId = userId as string;
      if (city) params.city = city as string;
      if (tags) {
        if (Array.isArray(tags)) {
          params.tags = tags as string[];
        } else if (typeof tags === 'string') {
          params.tags = [tags as string];
        }
      }
      if (isPublished !== undefined) params.isPublished = isPublished === 'true';
      params.page = parseInt(page as string);
      params.pageSize = parseInt(pageSize as string);
      params.sortBy = sortBy as string;

      const result = await blogService.fetchPosts(params);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '获取博客文章列表失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取博客文章详情
   */
  static async loadBlogId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const idStr = Array.isArray(id) ? id[0] : id;

      const blog = await blogService.getPost(idStr);

      if (!blog) {
        res.status(404).json({
          success: false,
          message: '博客文章不存在',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: blog,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '获取博客文章详情失败',
        error: error.message,
      });
    }
  }

  /**
   * 增加博客浏览量
   */
  static async incViews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const idStr = Array.isArray(id) ? id[0] : id;

      await blogService.bumpView(idStr);

      res.status(200).json({
        success: true,
        message: '浏览量增加成功',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '增加浏览量失败',
        error: error.message,
      });
    }
  }

  /**
   * 更新博客文章
   */
  static async updBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, title, content, coverImage, tags, city, spotIds, isPublished } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: '缺少userId字段',
        });
        return;
      }

      const idStr = Array.isArray(id) ? id[0] : id;
      const blog = await blogService.editPost(idStr, userId, {
        title,
        content,
        coverImage,
        tags,
        city,
        spotIds,
        isPublished,
      });

      if (!blog) {
        res.status(404).json({
          success: false,
          message: '博客文章不存在或无权修改',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: '博客文章更新成功',
        data: blog,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '更新博客文章失败',
        error: error.message,
      });
    }
  }

  /**
   * 删除博客文章
   */
  static async delBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: '缺少userId字段',
        });
        return;
      }

      const idStr = Array.isArray(id) ? id[0] : id;
      const success = await blogService.delBlog(idStr, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: '博客文章删除成功',
        });
      } else {
        res.status(404).json({
          success: false,
          message: '博客文章不存在或无权删除',
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '删除博客文章失败',
        error: error.message,
      });
    }
  }

  /**
   * 点赞/取消点赞
   */
  static async blogLike(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: '缺少userId字段',
        });
        return;
      }

      const postIdStr = Array.isArray(postId) ? postId[0] : postId;
      const result = await blogService.Like(postIdStr, userId);

      res.status(200).json({
        success: true,
        message: result.liked ? '点赞成功' : '取消点赞成功',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '点赞操作失败',
        error: error.message,
      });
    }
  }

  /**
   * 添加评论
   */
  static async addCmt(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { userId, content } = req.body;

      if (!userId || !content) {
        res.status(400).json({
          success: false,
          message: '缺少必填字段：userId、content',
        });
        return;
      }

      const postIdStr = Array.isArray(postId) ? postId[0] : postId;
      const comment = await blogService.cmtAdd(postIdStr, userId, content);

      res.status(201).json({
        success: true,
        message: '评论添加成功',
        data: comment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '添加评论失败',
        error: error.message,
      });
    }
  }

  /**
   * 删除评论
   */
  static async delCmt(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: '缺少userId字段',
        });
        return;
      }

      const commentIdStr = Array.isArray(commentId) ? commentId[0] : commentId;
      const success = await blogService.removeCmt(commentIdStr, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: '评论删除成功',
        });
      } else {
        res.status(404).json({
          success: false,
          message: '评论不存在或无权删除',
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '删除评论失败',
        error: error.message,
      });
    }
  }

  /**
   * 点赞/取消点赞评论
   */
  static async likeCmt(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: '缺少userId字段',
        });
        return;
      }

      const commentIdStr = Array.isArray(commentId) ? commentId[0] : commentId;
      const result = await blogService.cmtLike(commentIdStr, userId);

      res.status(200).json({
        success: true,
        message: result.liked ? '点赞成功' : '取消点赞成功',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '点赞操作失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取热门标签
   */
  static async hotTags(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '20' } = req.query;
      const limitNum = parseInt(limit as string);

      const tags = await blogService.hotTags(limitNum);

      res.status(200).json({
        success: true,
        data: tags,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '获取热门标签失败',
        error: error.message,
      });
    }
  }
}
