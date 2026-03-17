"use client"

import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Compass, Ruler, Search } from "lucide-react"

interface TimelineEvent {
  id: number
  time: string
  status: "done" | "now" | "pending"
  type: "attraction" | "meal"
  title: string
  subtitle?: string
  tags?: string[]
  iotChips?: { label: string; color: "green" | "amber" | "blue" }[]
  icon?: string
}

const timelineEvents: TimelineEvent[] = [
  {
    id: 1,
    time: "09:00",
    status: "done",
    type: "attraction",
    title: "浅草寺",
    tags: ["⛩寺庙", "历史"],
    iotChips: [
      { label: "人流低", color: "green" },
      { label: "16°C 晴", color: "blue" },
    ],
  },
  {
    id: 2,
    time: "12:00",
    status: "done",
    type: "meal",
    title: "浅草 寿司大 本店",
    subtitle: "推荐午餐 · 人均 ¥80 · 步行5分钟",
    icon: "🍱",
  },
  {
    id: 3,
    time: "14:00",
    status: "now",
    type: "attraction",
    title: "上野公园（赏樱）",
    tags: ["🌸樱花", "公园"],
    iotChips: [
      { label: "人流较多", color: "amber" },
      { label: "16°C", color: "blue" },
    ],
  },
  {
    id: 4,
    time: "18:00",
    status: "pending",
    type: "meal",
    title: "上野 磯丸水産",
    subtitle: "推荐晚餐 · 人均 ¥150 · 步行3分钟",
    icon: "🍣",
  },
  {
    id: 5,
    time: "20:00",
    status: "pending",
    type: "attraction",
    title: "秋叶原电器街",
    tags: ["🛍购物", "科技"],
    iotChips: [{ label: "人流低", color: "green" }],
  },
]

const getChipStyles = (color: "green" | "amber" | "blue") => {
  switch (color) {
    case "green":
      return "bg-secondary text-primary border-primary/20"
    case "amber":
      return "bg-[#fef3dc] text-[#7a4800] border-[#f5a623]/25"
    case "blue":
      return "bg-[#e8f0fb] text-[#1e4a8a] border-[#3b82c4]/20"
  }
}

export default function TodayTripPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AppSidebar />

      <main className="pt-14 lg:pl-[220px] h-screen">
        <div className="flex h-[calc(100vh-56px)]">
          {/* Left: Timeline View */}
          <div className="flex-1 overflow-y-auto p-5 lg:p-5.5">
            {/* Trip Selector Card */}
            <Card className="mb-4">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">东京深度游</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Day 1 · 2026年3月20日（周五）
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 bg-secondary border-primary/30 text-primary hover:bg-secondary/80"
                >
                  切换行程
                </Button>
              </CardContent>
            </Card>

            {/* Date Bar */}
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[13px] font-semibold text-foreground">今日行程</span>
              <span className="text-xs text-muted-foreground">
                📅 2026/03/20 · 晴 16°C
              </span>
            </div>

            {/* Timeline */}
            <div className="space-y-0">
              {timelineEvents.map((event, index) => (
                <div key={event.id} className="flex gap-3">
                  {/* Time Label */}
                  <div className="w-12 text-[11px] text-muted-foreground text-right pt-2.5 flex-shrink-0">
                    {event.time}
                  </div>

                  {/* Vertical Line Column */}
                  <div className="flex flex-col items-center flex-shrink-0 w-3.5">
                    {/* Dot */}
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-3 ${
                        event.status === "done"
                          ? "bg-primary"
                          : event.status === "now"
                          ? "bg-accent shadow-[0_0_0_3px_#fef3dc]"
                          : "bg-card border-2 border-border"
                      }`}
                    />
                    {/* Line */}
                    {index < timelineEvents.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-1" />
                    )}
                  </div>

                  {/* Event Card */}
                  <div className="flex-1 pb-3">
                    {event.type === "attraction" ? (
                      <Card
                        className={`${
                          event.status === "now" ? "border-accent" : ""
                        }`}
                      >
                        <CardContent className="p-2.5 px-3">
                          {event.status === "now" && (
                            <span className="text-[10px] text-accent font-medium mb-1 block">
                              ▶ 正在进行
                            </span>
                          )}
                          <h4 className="text-sm font-medium text-foreground mb-1.5">
                            {event.title}
                          </h4>
                          {event.tags && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {event.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {event.iotChips && (
                            <div className="flex flex-wrap gap-1.5">
                              {event.iotChips.map((chip, i) => (
                                <span
                                  key={i}
                                  className={`text-[10px] px-2 py-0.5 rounded-md border ${getChipStyles(chip.color)}`}
                                >
                                  {chip.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-[#e8f0fb] border-[#3b82c4]/30">
                        <CardContent className="p-2.5 px-3 flex items-center gap-2">
                          <span className="text-xl">{event.icon}</span>
                          <div>
                            <h4 className="text-sm font-medium text-[#1e4a8a]">
                              {event.title}
                            </h4>
                            <p className="text-[11px] text-[#1e4a8a]/70">
                              {event.subtitle}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Map Panel */}
          <div className="hidden lg:flex w-[340px] border-l border-border bg-card flex-col">
            {/* Header */}
            <div className="p-3 px-3.5 border-b border-border flex items-center justify-between">
              <span className="text-[13px] font-semibold text-foreground">
                🗺 今日地图
              </span>
              <span className="text-[11px] text-muted-foreground">
                东京 · 台東区
              </span>
            </div>

            {/* Map Placeholder */}
            <div className="flex-1 relative overflow-hidden">
              {/* Background gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, #e8f5ee 0%, #c8e6d6 30%, #b5d8e8 70%, #a8d4e6 100%)",
                }}
              />

              {/* Grid overlay */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
                  `,
                  backgroundSize: "30px 30px",
                }}
              />

              {/* Map pins */}
              <div className="absolute top-[20%] left-[30%] text-2xl animate-bounce" style={{ animationDuration: "2s" }}>
                📍
              </div>
              <div className="absolute top-[45%] left-[25%] text-2xl">
                🌸
              </div>
              <div className="absolute bottom-[25%] right-[25%] text-2xl">
                🛍
              </div>

              {/* Dashed route path */}
              <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
                <path
                  d="M 100 80 Q 90 150 95 180 Q 100 220 180 260"
                  fill="none"
                  stroke="#1a6b4a"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                />
              </svg>

              {/* Bottom label */}
              <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-muted-foreground">
                高德地图 · 景点路线
              </div>
            </div>

            {/* Map Toolbar */}
            <div className="p-2.5 px-3 border-t border-border flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                导航
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 gap-1.5"
              >
                <Ruler className="w-3.5 h-3.5" />
                路线
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                搜索
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
