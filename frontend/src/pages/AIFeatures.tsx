// AI 功能页面 - 聊天对话框设计
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, PenLine, List, MapPin, ChevronRight, Send, Sparkles } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';

interface Message {
  id: number;
  role: "ai" | "user";
  content: string;
}

const quickQuestions = [
  "帮我规划一个5天的东京之旅",
  "日本旅行需要准备什么签证材料？",
  "东京有哪些必去的美食店？",
  "推荐几个适合赏樱的景点",
  "如何从东京到京都最方便？",
  "日本交通卡怎么买最划算？",
];

export default function AIFeatures() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "ai",
      content: "你好！我是你的 AI 旅行顾问 🌍\n\n我可以帮你：\n• 规划个性化行程\n• 推荐景点和美食\n• 解答旅行相关问题\n• 提供实时旅行建议\n\n有什么我可以帮助你的吗？",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (message?: string) => {
    const text = message || inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: text,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // 调用后端 AI 顾问 API
      const response = await fetch('http://localhost:3003/api/advisor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          question: text,
          planContext: null,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.answer) {
        const aiResponse: Message = {
          id: messages.length + 2,
          role: "ai",
          content: data.data.answer,
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(data.error || '获取回答失败');
      }
    } catch (error: any) {
      console.error('❌ AI顾问请求失败:', error);
      // 显示错误消息
      const errorMessage: Message = {
        id: messages.length + 2,
        role: "ai",
        content: `抱歉，AI顾问暂时无法使用。错误信息：${error.message || '请稍后再试'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[220px] h-full flex items-center px-4 border-r border-border shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}>
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center"><span className="text-lg">✈️</span></div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-livetrip-primary-dark font-serif">LiveTrip</span>
              <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">AI · IoT · Travel</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="搜索目的地、景点、攻略…" className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-none outline-none text-sm focus:ring-2 focus:ring-livetrip-primary/20 transition-all" />
          </div>
        </div>

        <div className="flex items-center gap-1 px-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={() => navigate('/favorites')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-xs font-medium">ZL</div>
            <span className={`text-sm font-medium text-livetrip-primary-dark ${isLargeScreen ? 'block' : 'hidden'}`}>Zhang Lei</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isLargeScreen={isLargeScreen}
        currentPage={location.pathname}
      />

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        <div className="max-w-3xl mx-auto px-6 py-6 lg:px-7">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="font-serif text-xl font-semibold text-foreground">AI 旅行顾问</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">智能对话，为你提供专业的旅行建议和规划服务</p>
          </div>

          {/* Chat Container */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Messages Area */}
            <div className="h-[400px] overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                  {message.role === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-livetrip-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    message.role === "ai" 
                      ? "bg-muted rounded-2xl rounded-tl-sm text-foreground" 
                      : "bg-livetrip-primary text-white rounded-2xl rounded-tr-sm"
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-livetrip-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            <div className="border-t border-border p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">常见问题：</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    className="px-3 py-1.5 rounded-full text-xs bg-secondary text-primary border border-primary/20 hover:bg-primary hover:text-white transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                  placeholder="输入你的问题..."
                  className="flex-1 h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 bg-livetrip-primary hover:bg-livetrip-primary-dark text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
