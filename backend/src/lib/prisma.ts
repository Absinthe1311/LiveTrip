/**
 * PrismaClient 单例
 * 避免多个数据库连接导致数据库锁定问题
 */

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// 导出兼容的默认实例
export default getPrismaClient();
