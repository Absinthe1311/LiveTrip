import { Request, Response } from 'express';
import { getPrismaClient } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

const prisma = getPrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'livetrip-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role?: string;
      };
    }
  }
}

interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
  avatar?: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, avatar }: RegisterRequest = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码为必填项' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: '密码长度至少为6位' });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: '用户名已存在' });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, error: '邮箱已被使用' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email: email || null,
        passwordHash,
        avatar: avatar || ''
      }
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    console.log('✅ 用户注册成功:', username);
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (err: any) {
    console.error('❌ 注册失败:', err);
    res.status(500).json({ success: false, error: err.message || '注册失败，请稍后重试' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码为必填项' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    console.log('✅ 用户登录成功:', username);
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (err: any) {
    console.error('❌ 登录失败:', err);
    res.status(500).json({ success: false, error: err.message || '登录失败，请稍后重试' });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: '未提供认证 Token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    console.log('✅ 获取用户信息成功:', user.username);
    res.json({ success: true, data: { user } });
  } catch (err: any) {
    console.error('❌ 获取用户信息失败:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Token 无效' });
    }
    res.status(500).json({ success: false, error: err.message || '获取用户信息失败' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { username, email, avatar } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, error: '未授权，请先登录' });
    }

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: { username, id: { not: userId } }
      });
      if (existingUser) {
        return res.status(400).json({ success: false, error: '用户名已被使用' });
      }
    }

    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email, id: { not: userId } }
      });
      if (existingEmail) {
        return res.status(400).json({ success: false, error: '邮箱已被使用' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(avatar !== undefined && { avatar })
      }
    });

    console.log('✅ 用户信息更新成功:', updatedUser.username);
    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt
        }
      }
    });
  } catch (err: any) {
    console.error('❌ 更新用户信息失败:', err);
    res.status(500).json({ success: false, error: err.message || '更新用户信息失败' });
  }
};

export const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: '未提供认证 Token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token 无效' });
  }
};
