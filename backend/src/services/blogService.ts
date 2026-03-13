/**
 * Blog服务
 * 处理博客文章的创建、查询、更新、删除和社交功能
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateBlogData {
  userId: string;
  title: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  city?: string;
  spotIds?: string[];
  isPublished?: boolean;
}

export interface UpdateBlogData {
  title?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  city?: string;
  spotIds?: string[];
  isPublished?: boolean;
}

export interface BlogPostWithRelations {
  id: string;
  userId: string;
  title: string;
  content: string;
  coverImage: string | null;
  tags: string;
  city: string | null;
  spotIds: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comments: Array<{
    id: string;
    userId: string;
    content: string;
    createdAt: Date;
  }>;
  likes: Array<{
    userId: string;
    createdAt: Date;
  }>;
}

class BlogService {
  /**
   * 创建博客文章
   */
  async createBlog(data: CreateBlogData): Promise<BlogPostWithRelations> {
    try {
      const blog = await prisma.blogPost.create({
        data: {
          userId: data.userId,
          title: data.title,
          content: data.content,
          coverImage: data.coverImage,
          tags: data.tags?.join(',') || '',
          city: data.city,
          spotIds: data.spotIds?.join(',') || '',
          isPublished: data.isPublished || false,
          publishedAt: data.isPublished ? new Date() : null,
        },
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          likes: {
            select: {
              userId: true,
              createdAt: true,
            },
          },
        },
      });

      console.log(`✅ 创建博客文章成功: 标题=${data.title}`);
      return blog;
    } catch (error) {
      console.error(`❌ 创建博客文章失败:`, error);
      throw error;
    }
  }

  /**
   * 获取博客文章列表
   */
  async getBlogPosts(params: {
    userId?: string;
    city?: string;
    tags?: string[];
    isPublished?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: 'latest' | 'popular' | 'mostLiked';
  } = {}): Promise<{
    posts: BlogPostWithRelations[];
    total: number;
  }> {
    try {
      const {
        userId,
        city,
        tags,
        isPublished = true,
        page = 1,
        pageSize = 10,
        sortBy = 'latest',
      } = params;

      const skip = (page - 1) * pageSize;

      // 构建过滤条件
      const where: any = {};
      if (userId) where.userId = userId;
      if (city) where.city = city;
      if (isPublished !== undefined) where.isPublished = isPublished;
      if (tags && tags.length > 0) {
        where.tags = {
          contains: tags.join('|'),
        };
      }

      // 排序
      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'popular') {
        orderBy = { viewCount: 'desc' };
      } else if (sortBy === 'mostLiked') {
        orderBy = { likeCount: 'desc' };
      }

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          include: {
            comments: {
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
            likes: {
              select: {
                userId: true,
                createdAt: true,
              },
            },
          },
          orderBy,
          skip,
          take: pageSize,
        }),
        prisma.blogPost.count({ where }),
      ]);

      console.log(`✅ 获取博客文章成功: 总数=${total}`);
      return {
        posts,
        total,
      };
    } catch (error) {
      console.error(`❌ 获取博客文章失败:`, error);
      throw error;
    }
  }

  /**
   * 获取博客文章详情
   */
  async getBlogPostById(id: string): Promise<BlogPostWithRelations | null> {
    try {
      const blog = await prisma.blogPost.findUnique({
        where: { id },
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
          },
          likes: {
            select: {
              userId: true,
              createdAt: true,
            },
          },
        },
      });

      console.log(`✅ 获取博客文章详情成功: ID=${id}`);
      return blog;
    } catch (error) {
      console.error(`❌ 获取博客文章详情失败:`, error);
      throw error;
    }
  }

  /**
   * 增加博客浏览量
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      await prisma.blogPost.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      console.log(`✅ 增加浏览量成功: ID=${id}`);
    } catch (error) {
      console.error(`❌ 增加浏览量失败:`, error);
      throw error;
    }
  }

  /**
   * 更新博客文章
   */
  async updateBlog(id: string, userId: string, data: UpdateBlogData): Promise<BlogPostWithRelations | null> {
    try {
      // 检查权限
      const existingBlog = await prisma.blogPost.findUnique({
        where: { id },
      });

      if (!existingBlog || existingBlog.userId !== userId) {
        return null;
      }

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
      if (data.tags !== undefined) updateData.tags = data.tags.join(',');
      if (data.city !== undefined) updateData.city = data.city;
      if (data.spotIds !== undefined) updateData.spotIds = data.spotIds.join(',');
      if (data.isPublished !== undefined) {
        updateData.isPublished = data.isPublished;
        updateData.publishedAt = data.isPublished ? new Date() : null;
      }

      const blog = await prisma.blogPost.update({
        where: { id },
        data: updateData,
        include: {
          comments: {
            orderBy: { createdAt: 'desc' },
          },
          likes: {
            select: {
              userId: true,
              createdAt: true,
            },
          },
        },
      });

      console.log(`✅ 更新博客文章成功: ID=${id}`);
      return blog;
    } catch (error) {
      console.error(`❌ 更新博客文章失败:`, error);
      throw error;
    }
  }

  /**
   * 删除博客文章
   */
  async deleteBlog(id: string, userId: string): Promise<boolean> {
    try {
      const blog = await prisma.blogPost.findUnique({
        where: { id },
      });

      if (!blog || blog.userId !== userId) {
        return false;
      }

      await prisma.blogPost.delete({
        where: { id },
      });

      console.log(`✅ 删除博客文章成功: ID=${id}`);
      return true;
    } catch (error) {
      console.error(`❌ 删除博客文章失败:`, error);
      throw error;
    }
  }

  /**
   * 点赞/取消点赞
   */
  async toggleLike(postId: string, userId: string): Promise<{
    liked: boolean;
    likeCount: number;
  }> {
    try {
      const existingLike = await prisma.blogLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      let liked: boolean;
      let likeCount: number;

      if (existingLike) {
        // 取消点赞
        await prisma.blogLike.delete({
          where: { id: existingLike.id },
        });
        liked = false;
        likeCount = await prisma.blogLike.count({ where: { postId } });

        await prisma.blogPost.update({
          where: { id: postId },
          data: { likeCount },
        });
      } else {
        // 点赞
        await prisma.blogLike.create({
          data: {
            postId,
            userId,
          },
        });
        liked = true;
        likeCount = await prisma.blogLike.count({ where: { postId } });

        await prisma.blogPost.update({
          where: { id: postId },
          data: { likeCount },
        });
      }

      console.log(`✅ ${liked ? '点赞' : '取消点赞'}成功: 文章ID=${postId}, 用户ID=${userId}`);
      return { liked, likeCount };
    } catch (error) {
      console.error(`❌ 点赞操作失败:`, error);
      throw error;
    }
  }

  /**
   * 添加评论
   */
  async addComment(postId: string, userId: string, content: string): Promise<{
    id: string;
    content: string;
    userId: string;
    createdAt: Date;
  }> {
    try {
      // 检查文章是否存在
      const post = await prisma.blogPost.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new Error('文章不存在');
      }

      const comment = await prisma.blogComment.create({
        data: {
          postId,
          userId,
          content,
        },
      });

      // 更新评论数
      await prisma.blogPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      console.log(`✅ 添加评论成功: 文章ID=${postId}`);
      return comment;
    } catch (error) {
      console.error(`❌ 添加评论失败:`, error);
      throw error;
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const comment = await prisma.blogComment.findUnique({
        where: { id: commentId },
      });

      if (!comment || comment.userId !== userId) {
        return false;
      }

      await prisma.blogComment.delete({
        where: { id: commentId },
      });

      // 更新评论数
      await prisma.blogPost.update({
        where: { id: comment.postId },
        data: { commentCount: { increment: -1 } },
      });

      console.log(`✅ 删除评论成功: 评论ID=${commentId}`);
      return true;
    } catch (error) {
      console.error(`❌ 删除评论失败:`, error);
      throw error;
    }
  }

  /**
   * 点赞/取消点赞评论
   */
  async toggleCommentLike(commentId: string, userId: string): Promise<{
    liked: boolean;
    likeCount: number;
  }> {
    try {
      const existingLike = await prisma.blogCommentLike.findUnique({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });

      let liked: boolean;
      let likeCount: number;

      if (existingLike) {
        // 取消点赞
        await prisma.blogCommentLike.delete({
          where: { id: existingLike.id },
        });
        liked = false;
        likeCount = await prisma.blogCommentLike.count({ where: { commentId } });

        await prisma.blogComment.update({
          where: { id: commentId },
          data: { likeCount },
        });
      } else {
        // 点赞
        await prisma.blogCommentLike.create({
          data: {
            commentId,
            userId,
          },
        });
        liked = true;
        likeCount = await prisma.blogCommentLike.count({ where: { commentId } });

        await prisma.blogComment.update({
          where: { id: commentId },
          data: { likeCount },
        });
      }

      console.log(`✅ ${liked ? '点赞' : '取消点赞'}成功: 评论ID=${commentId}, 用户ID=${userId}`);
      return { liked, likeCount };
    } catch (error) {
      console.error(`❌ 点赞操作失败:`, error);
      throw error;
    }
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    try {
      const posts = await prisma.blogPost.findMany({
        where: {
          isPublished: true,
          tags: { not: '' },
        },
        select: { tags: true },
      });

      const tagCount: Record<string, number> = {};
      posts.forEach((post) => {
        post.tags.split(',').forEach((tag) => {
          if (tag.trim()) {
            tagCount[tag.trim()] = (tagCount[tag.trim()] || 0) + 1;
          }
        });
      });

      const sortedTags = Object.entries(tagCount)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return sortedTags;
    } catch (error) {
      console.error(`❌ 获取热门标签失败:`, error);
      throw error;
    }
  }
}

// 导出单例
export const blogService = new BlogService();