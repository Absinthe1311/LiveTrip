// AI 咨询组件 - 简单的旅行建议
import { useState } from 'react';
import { Sparkles, Send, ChevronDown, ChevronUp } from 'lucide-react';

interface AIAdvisorProps {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
}

const QUICK_QUESTIONS = [
  '这个目的地有什么特色？',
  '最佳旅行时间是什么时候？',
  '有什么必去的景点？',
  '当地美食推荐',
  '需要注意什么？',
];

export default function AIAdvisor({
  destination,
  startDate,
  endDate,
  budget,
}: AIAdvisorProps) {
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([
    {
      role: 'ai',
      content: destination 
        ? `您好！我是您的 AI 旅行顾问。关于 ${destination} 的旅行，有什么我可以帮助您的吗？`
        : '您好！我是您的 AI 旅行顾问。请先选择目的地，我将为您提供专业的旅行建议。',
    },
  ]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user' as const, content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // 模拟 AI 回复
    setTimeout(() => {
      const aiResponse = {
        role: 'ai' as const,
        content: getAIResponse(inputValue, destination),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 500);
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h4 className="text-[15px] font-semibold text-foreground">AI 旅行顾问</h4>
            <p className="text-[12px] text-muted-foreground">获取专业的旅行建议</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-border">
          {/* Messages */}
          <div className="h-[200px] overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-[13px] ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Questions */}
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-[12px] text-muted-foreground hover:bg-gray-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入您的问题..."
                className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 简单的 AI 回复逻辑
function getAIResponse(question: string, destination?: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('特色') || q.includes('特点')) {
    return destination 
      ? `${destination}是一个充满魅力的目的地，拥有独特的文化、美食和自然风光。建议您深入了解当地的历史文化，品尝特色美食。`
      : '请先选择目的地，我将为您介绍其特色。';
  }
  
  if (q.includes('时间') || q.includes('季节')) {
    return '最佳旅行时间通常是春秋两季，气候宜人，适合户外活动。建议避开当地的雨季和极端天气时期。';
  }
  
  if (q.includes('景点') || q.includes('必去')) {
    return destination
      ? `${destination}有很多值得一去的景点。建议您提前规划路线，合理安排时间，避免错过精华景点。`
      : '请先选择目的地，我将为您推荐必去景点。';
  }
  
  if (q.includes('美食') || q.includes('吃')) {
    return '当地美食是旅行的重要部分。建议尝试当地特色菜肴，体验地道的饮食文化。可以参考美食攻略或询问当地人推荐。';
  }
  
  if (q.includes('注意') || q.includes('提醒')) {
    return '出行前请准备好必要的证件和物品，了解当地的风俗习惯，注意人身和财产安全。建议购买旅行保险。';
  }
  
  return '感谢您的提问！我会尽力为您提供有用的旅行建议。如有具体问题，请随时询问。';
}
