import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 管理员权限验证中间件
 * 验证用户是否已登录且角色为admin
 */
export const chkAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 检查是否有用户信息
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        error: '请先登录',
      });
      return;
    }

    // 查询用户信息，获取角色
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    // 验证用户角色
    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: '您没有权限执行此操作',
      });
      return;
    }

    // 将角色信息添加到请求对象
    req.user.role = user.role;

    next();
  } catch (error) {
    console.error('管理员权限验证失败:', error);
    res.status(500).json({
      success: false,
      error: '权限验证失败',
    });
  }
};

/**
 * 可选的管理员权限验证中间件
 * 如果用户已登录，验证是否为管理员；否则继续执行
 */
export const adminOpt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 如果没有用户信息，直接继续
    if (!req.user || !req.user.userId) {
      next();
      return;
    }

    // 查询用户信息，获取角色
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    if (user) {
      // 将角色信息添加到请求对象
      req.user.role = user.role;
    }

    next();
  } catch (error) {
    console.error('可选管理员权限验证失败:', error);
    next();
  }
};

/**
 * 检查用户是否为特定角色的中间件
 * @param allowedRoles 允许的角色列表
 */
export const needRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 检查是否有用户信息
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        });
        return;
      }

      // 查询用户信息，获取角色
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: '用户不存在',
        });
        return;
      }

      // 验证用户角色
      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: '您没有权限执行此操作',
        });
        return;
      }

      // 将角色信息添加到请求对象
      req.user.role = user.role;

      next();
    } catch (error) {
      console.error('角色权限验证失败:', error);
      res.status(500).json({
        success: false,
        error: '权限验证失败',
      });
    }
  };
};

/**
 * 检查资源所有权或管理员权限的中间件
 * @param getResourceOwner 获取资源所有者ID的函数
 */
export const canEdit = (
  getResourceOwner: (req: Request) => Promise<string | null>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 检查是否有用户信息
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        });
        return;
      }

      // 查询用户信息，获取角色
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: '用户不存在',
        });
        return;
      }

      // 如果是管理员，直接通过
      if (user.role === 'admin') {
        req.user.role = user.role;
        next();
        return;
      }

      // 获取资源所有者ID
      const resourceOwnerId = await getResourceOwner(req);

      // 检查是否为资源所有者
      if (resourceOwnerId === req.user.userId) {
        req.user.role = user.role;
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: '您没有权限执行此操作',
      });
    } catch (error) {
      console.error('所有权验证失败:', error);
      res.status(500).json({
        success: false,
        error: '权限验证失败',
      });
    }
  };
};
