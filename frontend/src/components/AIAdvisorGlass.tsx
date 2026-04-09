// AI 咨询组件 - 毛玻璃风格版本
import { useState } from 'react';
import { Sparkles, Send, Bot, MessageCircle } from 'lucide-react';
import { aiService, ChatMode } from '../services/aiService';
import { GlassCard } from './home';

interface AIAdvisorGlassProps {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  defaultMode?: ChatMode;
}

const QUICK_QUESTIONS = [
  '这个目的地有什么特色？',
  '最佳旅行时间是什么时候？',
  '有什么必去的景点？',
  '当地美食推荐',
];

export default function AIAdvisorGlass({
  destination,
  startDate,
  endDate,
  budget,
  defaultMode = 'advisor',
}: AIAdvisorGlassProps) {
  const [mode, setMode] = useState<ChatMode>(defaultMode);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: destination
        ? `您好！我是您的 AI 旅行顾问。关于 ${destination} 的旅行，有什么我可以帮助您的吗？`
        : '您好！我是您的 AI 旅行顾问。请先选择目的地，我将为您提供专业的旅行建议。',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      let data;
      if (mode === 'advisor') {
        data = await aiService.sendAdvisorMessage(inputValue, {
          destination,
          startDate,
          endDate,
          budget,
        });
      } else {
        data = await aiService.sendAgentMessage(inputValue);
      }

      if (data.success && data.data?.answer) {
        const aiResponse = {
          role: 'assistant' as const,
          content: data.data.answer,
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(data.error || '获取回答失败');
      }
    } catch (error: any) {
      console.error('AI请求失败:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: `抱歉，AI暂时无法使用。错误信息：${error.message || '请稍后再试'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-livetrip-primary/20">
          <Bot className="h-5 w-5 text-livetrip-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">AI 旅行顾问</h3>
          <p className="text-xs text-white/60">智能规划您的旅程</p>
        </div>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('advisor')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'advisor'
              ? 'bg-livetrip-primary text-white'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <MessageCircle className="h-4 w-4 inline mr-1" />
          问答
        </button>
        <button
          onClick={() => setMode('agent')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'agent'
              ? 'bg-livetrip-primary text-white'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <Sparkles className="h-4 w-4 inline mr-1" />
          助手
        </button>
      </div>

      {/* 快捷问题 */}
      <div className="space-y-2">
        <p className="text-xs text-white/60 font-medium">快捷问题</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((question, index) => (
            <button
              key={index}
              onClick={() => setInputValue(question)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* 对话消息 */}
      <div className="max-h-[300px] overflow-y-auto space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-livetrip-primary text-white'
                  : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mb-1">
                  <Bot className="h-3 w-3 text-livetrip-primary" />
                  <span className="text-[10px] text-white/60">AI</span>
                </div>
              )}
              <p className="text-xs leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/20">
              <div className="flex items-center gap-2">
                <Bot className="h-3 w-3 text-livetrip-primary" />
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入您的问题..."
          className="w-full h-10 pl-3 pr-10 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={loading || !inputValue.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-livetrip-primary text-white hover:bg-livetrip-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
