// 创建行程页面 - 基于 V0 设计重构
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, Check, Send, Sparkles } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';

const steps = [
  { id: 1, label: "出发地", done: true },
  { id: 2, label: "目的地", done: true },
  { id: 3, label: "日期预算", done: false, active: true },
  { id: 4, label: "偏好", done: false },
  { id: 5, label: "确认", done: false },
];

const interests = [
  { id: "culture", label: "文化历史", icon: "🏛", selected: true },
  { id: "food", label: "美食探索", icon: "🍜", selected: true },
  { id: "nature", label: "自然风光", icon: "🏞", selected: false },
  { id: "shopping", label: "购物娱乐", icon: "🛍", selected: true },
  { id: "art", label: "艺术展览", icon: "🎭", selected: false },
  { id: "temple", label: "寺庙神社", icon: "⛩", selected: false },
];

interface Message {
  id: number;
  role: "ai" | "user";
  content: string;
}

export default function Plan() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    interests.filter(i => i.selected).map(i => i.id)
  );
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "ai", content: "你好！我是你的 AI 旅行顾问 🌍\n有任何关于旅行规划的问题，随时问我！" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: inputValue.trim(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        role: "ai",
        content: "好的，我会帮你规划行程！请告诉我你的出发地、目的地、日期和预算。",
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 600);
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
        <div className="flex h-[calc(100vh-56px)]">
          {/* Left: Multi-Step Form */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-7">
            {/* Step Progress Bar */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step.done ? "bg-primary text-primary-foreground" : step.active ? "bg-secondary text-primary border-2 border-primary" : "bg-muted text-muted-foreground border border-border"}`}>
                      {step.done ? <Check className="w-4 h-4" /> : step.id}
                    </div>
                    <span className={`text-xs mt-1.5 ${step.done || step.active ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
                  </div>
                  {index < steps.length - 1 && <div className={`w-12 lg:w-20 h-0.5 mx-2 ${step.done ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>

            {/* Form Cards */}
            <div className="space-y-4 max-w-2xl">
              {/* Card 1: 出行信息 */}
              <div className="bg-card border border-border rounded-lg">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-sm">📍</div>
                    <h3 className="font-medium text-foreground">出行信息</h3>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">出发城市</label>
                      <input type="text" placeholder="例如：上海" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">目的地</label>
                      <input type="text" placeholder="例如：东京，日本" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">出发日期</label>
                      <input type="date" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">返回日期</label>
                      <input type="date" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: 预算设置 */}
              <div className="bg-card border border-border rounded-lg">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-sm">💰</div>
                    <h3 className="font-medium text-foreground">预算设置</h3>
                  </div>
                </div>
                <div className="p-4">
                  <input type="text" placeholder="例如：¥6,000 — ¥10,000" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              {/* Card 3: 兴趣偏好 */}
              <div className="bg-card border border-border rounded-lg">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-sm">🎯</div>
                    <h3 className="font-medium text-foreground">兴趣偏好</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {interests.map(interest => (
                      <button
                        key={interest.id}
                        onClick={() => toggleInterest(interest.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedInterests.includes(interest.id) ? "bg-secondary text-primary border border-primary" : "bg-muted text-muted-foreground border border-border hover:border-primary/50"}`}
                      >
                        {interest.icon} {interest.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex gap-3 pt-2">
                <button className="px-4 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">上一步</button>
                <button className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  下一步：确认行程 →
                </button>
              </div>
            </div>
          </div>

          {/* Right: AI Travel Advisor Panel */}
          <div className="hidden lg:flex w-[300px] border-l border-border bg-card flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">AI 旅行顾问</h4>
                  <p className="text-xs text-muted-foreground">随时为你解答旅行问题</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {messages.map(message => (
                <div key={message.id} className={`${message.role === "user" ? "ml-auto" : ""}`}>
                  <div className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${message.role === "ai" ? "bg-muted border border-border rounded-tr-xl rounded-br-xl rounded-bl-xl text-foreground" : "bg-primary text-primary-foreground rounded-tl-xl rounded-tr-xl rounded-bl-xl ml-auto"}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="bg-muted border border-border rounded-tr-xl rounded-br-xl rounded-bl-xl max-w-[85%] px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-3.5">
              <div className="flex gap-2">
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                  placeholder="输入你的问题..."
                  className="flex-1 min-h-[36px] max-h-[100px] px-3 py-2 text-xs bg-muted rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={1}
                />
                <button onClick={handleSendMessage} disabled={!inputValue.trim()} className="w-9 h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md flex items-center justify-center disabled:opacity-50">
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
