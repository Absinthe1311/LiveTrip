"use client"

import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent } from "@/components/ui/card"

const aiFeatures = [
  {
    id: 1,
    icon: "🗺️",
    title: "AI 行程规划",
    description: "输入目的地和偏好，5步生成完整行程，包含景点、餐厅、酒店推荐。",
    badge: "智谱 AI · ChatGLM",
    badgeColor: "bg-secondary text-primary",
    gradient: "linear-gradient(90deg, #6366f1, #8b5cf6)",
  },
  {
    id: 2,
    icon: "📡",
    title: "IoT 实时数据",
    description: "接入景区客流传感器、气象数据，实时显示人流状态，智能推荐最佳游览时间。",
    badge: "IoT 数据源",
    badgeColor: "bg-[#e8f0fb] text-[#1e4a8a]",
    gradient: "linear-gradient(90deg, #1a6b4a, #2d9166)",
  },
  {
    id: 3,
    icon: "🔄",
    title: "动态行程调整",
    description: "根据实时人流、天气变化自动推荐备选景点，确保旅行体验最优。",
    badge: "实时优化",
    badgeColor: "bg-[#fef3dc] text-[#7a4800]",
    gradient: "linear-gradient(90deg, #f59e0b, #f97316)",
  },
  {
    id: 4,
    icon: "💬",
    title: "AI 旅行顾问",
    description: "创建行程过程中随时咨询，提供签证、货币、文化习俗等旅行知识。",
    badge: "全程陪伴",
    badgeColor: "bg-[#e8f0fb] text-[#1e4a8a]",
    gradient: "linear-gradient(90deg, #3b82f6, #06b6d4)",
  },
]

const iotChips = [
  { label: "浅草寺 · 人流低", color: "green" },
  { label: "上野公园 · 人流较多", color: "amber" },
  { label: "新宿御苑 · 人流中等", color: "green" },
  { label: "渋谷十字口 · 人流爆满", color: "red" },
  { label: "今日天气 · 16°C 晴间多云", color: "blue" },
  { label: "🌸 樱花开放度 · 80%", color: "green" },
]

const getChipStyles = (color: string) => {
  switch (color) {
    case "green":
      return "bg-secondary text-primary border-primary/20"
    case "amber":
      return "bg-[#fef3dc] text-[#7a4800] border-[#f5a623]/25"
    case "red":
      return "bg-red-50 text-red-700 border-red-200"
    case "blue":
      return "bg-[#e8f0fb] text-[#1e4a8a] border-[#3b82c4]/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export default function AIFeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AppSidebar />

      <main className="pt-14 lg:pl-[220px] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-6 lg:px-7">
          {/* Page Title */}
          <div className="mb-5">
            <h1 className="font-serif text-[22px] font-semibold text-foreground">
              AI 智能功能
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              结合 IoT 实时数据的智能旅行体验
            </p>
          </div>

          {/* AI Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
            {aiFeatures.map(feature => (
              <Card
                key={feature.id}
                className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                style={{ borderTop: `3px solid transparent`, borderImage: `${feature.gradient} 1` }}
              >
                <CardContent className="p-4">
                  <div className="text-[28px] mb-2">{feature.icon}</div>
                  <h3 className="font-medium text-foreground mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <span className={`inline-block text-[11px] px-2 py-0.5 rounded-md ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* IoT Live Data Panel */}
          <Card>
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-[7px] w-[7px]">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-green-500"></span>
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    IoT 实时数据 · 东京景区
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  更新于 2分钟前
                </span>
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap gap-2">
                {iotChips.map((chip, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border ${getChipStyles(chip.color)}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        chip.color === "green"
                          ? "bg-primary"
                          : chip.color === "amber"
                          ? "bg-[#f5a623]"
                          : chip.color === "red"
                          ? "bg-red-500"
                          : "bg-[#3b82f6]"
                      }`}
                    />
                    {chip.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
