// AI 咨询组件 - 毛玻璃风格版本（优化版）
import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, MapPin, Calendar, FileText, Heart } from 'lucide-react';
import { aiService } from '../services/aiService';

interface AIAdvisorGlassProps {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  defaultMode?: 'advisor' | 'agent';
}

const QUICK_QUESTIONS = [
  { icon: MapPin, text: '这个目的地有什么特色景点？' },
  { icon: Calendar, text: '最佳旅行时间是什么时候？' },
  { icon: Sparkles, text: '有什么必去的景点推荐？' },
  { icon: FileText, text: '当地美食和住宿建议' },
  { icon: MapPin, text: '详细介绍某个景点的历史和游览攻略' },
  { icon: Heart, text: '如何制定合理的旅行预算？' },
];

export default function AIAdvisorGlass({
  destination,
  startDate,
  endDate,
  budget,
}: AIAdvisorGlassProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{ 
    role: 'user' | 'assistant'; 
    content: string;
    timestamp?: Date;
  }>>([
    {
      role: 'assistant',
      content: destination
        ? `您好！我是您的 AI 旅行顾问。关于 ${destination} 的旅行，有什么我可以帮助您的吗？`
        : '您好！我是您的 AI 旅行顾问。请先选择目的地，我将为您提供专业的旅行建议。',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = { 
      role: 'user' as const, 
      content: inputValue,
      timestamp: new Date(),
    };
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
          timestamp: new Date(),
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
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // 格式化消息内容 - 支持分段显示
  const formatMessage = (content: string) => {
    // 按段落分割（双换行或单换行）
    const paragraphs = content.split(/\n\n+|\n/).filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // 检查是否是列表项（以 - 或 • 开头）
      const isListItem = paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•');
      
      // 检查是否是标题（以 # 开头）
      const isHeading = paragraph.trim().startsWith('#');
      
      return (
        <div 
          key={index} 
          className={`${index > 0 ? 'mt-2' : ''} ${
            isListItem ? 'pl-2 border-l-2 border-white/20' : ''
          } ${
            isHeading ? 'font-semibold text-white/90' : ''
          }`}
        >
          {paragraph}
        </div>
      );
    });
  };

  return (
    <div className="space-y-3 p-3">
      {/* 快捷问题 */}
      <div className="space-y-2">
        <p className="text-xs text-white/60 font-medium">快捷问题</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((question, index) => {
            const IconComponent = question.icon;
            return (
              <button
                key={index}
                onClick={() => setInputValue(question.text)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-xs text-white/70 hover:bg-[#AE1C31]/10 hover:border-[#AE1C31]/30 hover:text-white transition-all duration-300"
              >
                <IconComponent className="w-3 h-3" />
                {question.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* 对话消息 */}
      <div className="max-h-[200px] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* AI 头像 */}
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#008F8D]/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-[#008F8D]" />
              </div>
            )}
            
            {/* 消息内容 */}
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 backdrop-blur-md transition-all duration-300 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#008F8D]/20 to-[#008F8D]/10 text-white border border-[#008F8D]/30'
                  : 'bg-white/5 text-white border border-white/10'
              }`}
            >
              <div className="text-xs leading-relaxed">
                {formatMessage(msg.content)}
              </div>
              {msg.timestamp && (
                <div className="text-[10px] text-white/30 mt-1">
                  {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
            
            {/* 用户头像 */}
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <User className="h-3.5 w-3.5 text-white/60" />
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#008F8D]/10 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-[#008F8D]" />
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => !loading && setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
          placeholder={loading ? 'AI 正在思考中...' : '输入您的问题...'}
          className={`w-full px-4 py-2.5 pr-12 rounded-xl backdrop-blur-md border text-white text-sm outline-none transition-all duration-300 ${
            loading 
              ? 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed' 
              : 'bg-white/5 border-white/10 placeholder-white/40 focus:bg-white/10 focus:border-[#AE1C31]/30 focus:shadow-[0_0_15px_rgba(174,28,49,0.2)]'
          }`}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !inputValue.trim()}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white transition-all duration-300 ${
            loading 
              ? 'bg-white/10 cursor-not-allowed opacity-30' 
              : 'bg-gradient-to-r from-[#AE1C31] to-[#AE1C31]/80 hover:from-[#AE1C31]/90 hover:to-[#AE1C31]/70 shadow-lg shadow-[#AE1C31]/30 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
