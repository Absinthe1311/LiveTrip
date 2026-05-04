// AI 服务 - 统一的 AI 对话服务
import { getUserId } from '../utils/auth';
import { API_BASE_URL } from '../config/api';

export type ChatMode = 'advisor' | 'agent';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  previewData?: any;
  needsConfirmation?: boolean;
  sessionId?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  mode: ChatMode;
  createdAt: string;
  updatedAt: string;
}

export interface AIResponse {
  success: boolean;
  data?: {
    answer: string;
    message?: string;
    toolCalls?: Array<{
      name: string;
      result: any;
    }>;
  };
  error?: string;
  needsConfirmation?: boolean;
  needsMoreInfo?: boolean;
  previewData?: any;
  sessionId?: string;
}

/**
 * AI 服务类
 */
class AIService {
  private baseUrl = API_BASE_URL;

  /**
   * 发送消息（问答助手模式）
   */
  async sendAdvisorMessage(question: string, context?: any): Promise<AIResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const userId = getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(`${this.baseUrl}/advisor/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
        planContext: context,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 发送消息（智能助手模式，SSE 流式步骤推送）
   */
  async sendAgentMessageSSE(question: string, onStep: (step: string) => void): Promise<AIResponse> {
    const userId = getUserId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (userId) {
      headers['x-user-id'] = userId;
    }

    try {
      const response = await fetch(`${this.baseUrl}/agent/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: AIResponse | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'step') {
                onStep(parsed.message);
              } else if (parsed.type === 'result') {
                finalResult = {
                  success: parsed.success,
                  data: parsed.data,
                  error: parsed.error,
                  needsConfirmation: parsed.needsConfirmation,
                  needsMoreInfo: parsed.needsMoreInfo,
                  previewData: parsed.previewData,
                  sessionId: parsed.sessionId,
                };
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message);
              }
            } catch (e) {
              if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
            }
          }
        }
      }

      if (finalResult) return finalResult;
      return { success: false, error: '未收到有效响应' };
    } catch (error: any) {
      console.warn('SSE请求失败，降级为普通请求:', error.message);
      return this.sendAgentMessage(question);
    }
  }

  /**
   * 发送消息（智能助手模式）
   */
  async sendAgentMessage(question: string): Promise<AIResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const userId = getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(`${this.baseUrl}/agent/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 获取用户会话列表
   */
  async getUserSessions(mode?: ChatMode): Promise<ChatSession[]> {
    const headers: Record<string, string> = {};
    const userId = getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(`${this.baseUrl}/advisor/sessions${mode ? `?mode=${mode}` : ''}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * 获取会话的消息历史
   */
  async getSessionMessages(sessionId: string, limit: number = 10): Promise<Message[]> {
    const response = await fetch(
      `${this.baseUrl}/advisor/sessions/${sessionId}/messages?limit=${limit}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    const headers: Record<string, string> = {};
    const userId = getUserId();
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(`${this.baseUrl}/advisor/sessions/${sessionId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

// 导出单例
export const aiService = new AIService();
