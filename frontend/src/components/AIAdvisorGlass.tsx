// AI 咨询组件 - 毛玻璃风格版本（仅问答模式）
import { useState } from 'react';
import { Sparkles, Send, Bot } from 'lucide-react';
import { aiService } from '../services/aiService';

interface AIAdvisorGlassProps {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  defaultMode?: 'advisor' | 'agent';
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
}: AIAdvisorGlassProps) {
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
      const data = await aiService.sendAdvisorMessage(inputValue, {
        destination,
        startDate,
        endDate,
        budget,
      });

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
    <div className="space-y-3 p-3">
      {/* 快捷问题 */}
      <div className="space-y-2">
        <p className="text-xs text-white/60 font-medium">快捷问题</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((question, index) => (
            <button
              key={index}
              onClick={() => setInputValue(question)}
              className="px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-xs text-white/70 hover:bg-[#AE1C31]/10 hover:border-[#AE1C31]/30 hover:text-white transition-all duration-300"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* 对话消息 */}
      <div className="max-h-[200px] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 backdrop-blur-md transition-all duration-300 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#AE1C31]/20 to-[#AE1C31]/10 text-white border border-[#AE1C31]/30'
                  : 'bg-white/5 text-white border border-white/10'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1 mb-1">
                  <Bot className="h-3 w-3 text-[#AE1C31]" />
                  <span className="text-[10px] text-white/60">AI</span>
                </div>
              )}
              <p className="text-xs leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10">
              <div className="flex items-center gap-2">
                <Bot className="h-3 w-3 text-[#AE1C31]" />
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#AE1C31]/60 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#AE1C31]/60 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#AE1C31]/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div className="relative group">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入您的问题..."
          className="w-full px-4 py-2.5 pr-12 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white text-sm placeholder-white/40 outline-none focus:bg-white/10 focus:border-[#AE1C31]/30 focus:shadow-[0_0_15px_rgba(174,28,49,0.2)] transition-all duration-300"
        />
        <button
          onClick={handleSend}
          disabled={loading || !inputValue.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-[#AE1C31] to-[#AE1C31]/80 text-white hover:from-[#AE1C31]/90 hover:to-[#AE1C31]/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#AE1C31]/30"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
