// 对话历史服务 - 管理对话会话和消息
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

interface CreateSessionParams {
  userId?: string;
  mode: 'advisor' | 'agent';
}

interface CreateMessageParams {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  toolCall?: string;
}

interface GetMessagesParams {
  sessionId: string;
  limit?: number;
}

class ChatHistoryService {
  /**
   * 创建新的对话会话
   */
  async createSession(params: CreateSessionParams) {
    try {
      const session = await prisma.chatSession.create({
        data: {
          userId: params.userId,
          mode: params.mode,
        },
      });

      console.log(`✅ 创建对话会话成功: ${session.id}`);
      return session;
    } catch (error) {
      console.error('❌ 创建对话会话失败:', error);
      throw error;
    }
  }

  /**
   * 获取或创建会话（用于 advisor 模式）
   */
  async getOrCreateAdvisorSession(userId?: string) {
    try {
      // 查找最近 10 分钟内的 advisor 模式会话
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      let session = await prisma.chatSession.findFirst({
        where: {
          userId: userId || null,
          mode: 'advisor',
          createdAt: {
            gte: tenMinutesAgo,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 如果没有找到，创建新会话
      if (!session) {
        session = await this.createSession({
          userId,
          mode: 'advisor',
        });
      } else {
        // 更新会话的最后活跃时间
        session = await prisma.chatSession.update({
          where: { id: session.id },
          data: { updatedAt: new Date() },
        });
      }

      return session;
    } catch (error) {
      console.error('❌ 获取或创建会话失败:', error);
      throw error;
    }
  }

  /**
   * 获取或创建会话（用于 agent 模式）
   */
  async getOrCreateAgentSession(userId?: string) {
    try {
      // 查找最近 10 分钟内的 agent 模式会话
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      let session = await prisma.chatSession.findFirst({
        where: {
          userId: userId || null,
          mode: 'agent',
          createdAt: {
            gte: tenMinutesAgo,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 如果没有找到，创建新会话
      if (!session) {
        session = await this.createSession({
          userId,
          mode: 'agent',
        });
      } else {
        // 更新会话的最后活跃时间
        session = await prisma.chatSession.update({
          where: { id: session.id },
          data: { updatedAt: new Date() },
        });
      }

      return session;
    } catch (error) {
      console.error('❌ 获取或创建会话失败:', error);
      throw error;
    }
  }

  /**
   * 创建消息
   */
  async createMessage(params: CreateMessageParams) {
    try {
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: params.sessionId,
          role: params.role,
          content: params.content,
          toolCall: params.toolCall || '',
        },
      });

      // 更新会话的最后活跃时间
      await prisma.chatSession.update({
        where: { id: params.sessionId },
        data: { updatedAt: new Date() },
      });

      return message;
    } catch (error) {
      console.error('❌ 创建消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话的消息历史（限制最近 N 条）
   */
  async getMessages(params: GetMessagesParams) {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: {
          sessionId: params.sessionId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: params.limit || 10, // 默认返回最近 10 条消息
      });

      return messages;
    } catch (error) {
      console.error('❌ 获取消息历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有会话列表
   */
  async getUserSessions(userId?: string, mode?: 'advisor' | 'agent') {
    try {
      const where: any = {};

      if (userId) {
        where.userId = userId;
      } else {
        where.userId = null;
      }

      if (mode) {
        where.mode = mode;
      }

      const sessions = await prisma.chatSession.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        take: 50, // 最多返回 50 个会话
      });

      return sessions;
    } catch (error) {
      console.error('❌ 获取用户会话列表失败:', error);
      throw error;
    }
  }

  /**
   * 删除会话（及关联的所有消息）
   */
  async deleteSession(sessionId: string) {
    try {
      await prisma.chatSession.delete({
        where: { id: sessionId },
      });

      console.log(`✅ 删除会话成功: ${sessionId}`);
    } catch (error) {
      console.error('❌ 删除会话失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const chatHistoryService = new ChatHistoryService();
