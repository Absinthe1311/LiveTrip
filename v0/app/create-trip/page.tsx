"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Send, Sparkles } from "lucide-react"

const steps = [
  { id: 1, label: "出发地", done: true },
  { id: 2, label: "目的地", done: true },
  { id: 3, label: "日期预算", done: false, active: true },
  { id: 4, label: "偏好", done: false },
  { id: 5, label: "确认", done: false },
]

const interests = [
  { id: "culture", label: "文化历史", icon: "🏛", selected: true },
  { id: "food", label: "美食探索", icon: "🍜", selected: true },
  { id: "nature", label: "自然风光", icon: "🏞", selected: false },
  { id: "shopping", label: "购物娱乐", icon: "🛍", selected: true },
  { id: "art", label: "艺术展览", icon: "🎭", selected: false },
  { id: "temple", label: "寺庙神社", icon: "⛩", selected: false },
]

interface Message {
  id: number
  role: "ai" | "user"
  content: string
}

const initialMessages: Message[] = [
  { id: 1, role: "ai", content: "你好！我是你的 AI 旅行顾问 🌍\n有任何关于东京旅行的问题，随时问我！" },
  { id: 2, role: "ai", content: "💡 3月下旬东京樱花盛开，上野公园和新宿御苑是最佳赏樱地点，建议早上8点前到达避开人流。" },
]

export default function CreateTripPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    interests.filter(i => i.selected).map(i => i.id)
  )
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: inputValue.trim(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        role: "ai",
        content: "¥8,000 在东京7天是合理的中等预算 ✓\n• 机票：¥2,500–3,500（往返）\n• 住宿：¥150–250/晚\n• 餐饮：¥100–150/天\n• 景点+交通：¥50–80/天\n\n建议提前订酒店，3月旺季房价会上涨。",
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 600)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AppSidebar />

      <main className="pt-14 lg:pl-[220px] h-[calc(100vh-56px)]">
        <div className="flex h-full">
          {/* Left: Multi-Step Form */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-7">
            {/* Step Progress Bar */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        step.done
                          ? "bg-primary text-primary-foreground"
                          : step.active
                          ? "bg-secondary text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {step.done ? <Check className="w-4 h-4" /> : step.id}
                    </div>
                    <span className={`text-xs mt-1.5 ${step.done || step.active ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 lg:w-20 h-0.5 mx-2 ${
                        step.done ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Form Cards */}
            <div className="space-y-4 max-w-2xl">
              {/* Card 1: 出行信息 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-sm">
                      📍
                    </div>
                    <h3 className="font-medium text-foreground">出行信息</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">出发城市</label>
                      <Input value="上海" readOnly className="bg-muted/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">目的地</label>
                      <Input value="东京，日本" readOnly className="bg-muted/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">出发日期</label>
                      <Input type="date" defaultValue="2026-03-20" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">返回日期</label>
                      <Input type="date" defaultValue="2026-03-27" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: 预算设置 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-sm">
                      💰
                    </div>
                    <h3 className="font-medium text-foreground">预算设置</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <Input placeholder="例如：¥6,000 — ¥10,000" />
                </CardContent>
              </Card>

              {/* Card 3: 兴趣偏好 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-sm">
                      🎯
                    </div>
                    <h3 className="font-medium text-foreground">兴趣偏好</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {interests.map(interest => (
                      <button
                        key={interest.id}
                        onClick={() => toggleInterest(interest.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedInterests.includes(interest.id)
                            ? "bg-secondary text-primary border border-primary"
                            : "bg-muted text-muted-foreground border border-border hover:border-primary/50"
                        }`}
                      >
                        {interest.icon} {interest.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Buttons */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline">上一步</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90">
                  下一步：确认行程 →
                </Button>
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
                <div
                  key={message.id}
                  className={`${
                    message.role === "user" ? "ml-auto" : ""
                  }`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                      message.role === "ai"
                        ? "bg-muted border border-border rounded-tr-xl rounded-br-xl rounded-bl-xl text-foreground"
                        : "bg-primary text-primary-foreground rounded-tl-xl rounded-tr-xl rounded-bl-xl ml-auto"
                    }`}
                  >
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-3.5">
              <div className="flex gap-2">
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入你的问题..."
                  className="flex-1 min-h-[36px] max-h-[100px] px-3 py-2 text-xs bg-muted rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="w-9 h-9 bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
