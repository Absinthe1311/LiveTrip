"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Camera } from "lucide-react"

interface Trip {
  id: number
  name: string
  dates: string
  duration: string
  budget: string
  tags: string[]
  status: "planning" | "completed"
  image?: string
  placeholder?: { emoji: string; bg: string }
}

const trips: Trip[] = [
  {
    id: 1,
    name: "东京深度游",
    dates: "2026/03/20 — 03/27",
    duration: "7天",
    budget: "¥8,500",
    tags: ["🏛文化", "🍜美食", "🛍购物"],
    status: "planning",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&q=70",
  },
  {
    id: 2,
    name: "纽约城市游",
    dates: "2026/05/10 — 05/20",
    duration: "10天",
    budget: "¥18,000",
    tags: ["🎭艺术", "🏙都市"],
    status: "planning",
    placeholder: { emoji: "🗽", bg: "bg-blue-100" },
  },
  {
    id: 3,
    name: "京都赏樱",
    dates: "2026/02/01 — 02/05",
    duration: "5天",
    budget: "¥6,200",
    tags: ["⛩寺庙", "🌸赏花"],
    status: "completed",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=200&q=70",
  },
  {
    id: 4,
    name: "巴厘岛度假",
    dates: "2025/12/24 — 12/30",
    duration: "6天",
    budget: "¥5,800",
    tags: ["🏖海滩", "🧘瑜伽"],
    status: "completed",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&q=70",
  },
]

type FilterStatus = "all" | "planning" | "completed"

export default function MyTripsPage() {
  const [filter, setFilter] = useState<FilterStatus>("all")

  const filteredTrips = trips.filter(trip => {
    if (filter === "all") return true
    return trip.status === filter
  })

  const counts = {
    all: trips.length,
    planning: trips.filter(t => t.status === "planning").length,
    completed: trips.filter(t => t.status === "completed").length,
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AppSidebar />

      <main className="pt-14 lg:pl-[220px] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-6 lg:px-7">
          {/* Page Header */}
          <h1 className="font-serif text-xl font-semibold text-foreground mb-3.5">
            我的行程
          </h1>

          {/* Filter Tab Bar */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "all" as FilterStatus, label: "全部" },
              { key: "planning" as FilterStatus, label: "规划中" },
              { key: "completed" as FilterStatus, label: "已完成" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground border border-border hover:border-primary/50"
                }`}
              >
                {tab.label} ({counts[tab.key]})
              </button>
            ))}
          </div>

          {/* Trip Cards List */}
          <div className="space-y-2.5">
            {filteredTrips.map(trip => (
              <Card
                key={trip.id}
                className="flex overflow-hidden hover:border-foreground/20 transition-all"
              >
                {/* Left Image */}
                <div className="relative w-[110px] min-h-[90px] flex-shrink-0">
                  {trip.image ? (
                    <Image
                      src={trip.image}
                      alt={trip.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${trip.placeholder?.bg} flex items-center justify-center text-3xl`}>
                      {trip.placeholder?.emoji}
                    </div>
                  )}
                </div>

                {/* Middle Body */}
                <div className="flex-1 p-3.5 px-4">
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    {trip.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {trip.dates} · {trip.duration} · {trip.budget}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {trip.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Section */}
                <div className="p-3.5 px-4 flex flex-col items-end justify-between">
                  {/* Status Pill */}
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-md font-medium ${
                      trip.status === "planning"
                        ? "bg-[#fef3dc] text-[#7a4800]"
                        : "bg-secondary text-primary"
                    }`}
                  >
                    {trip.status === "planning" ? "规划中" : "已完成"}
                  </span>

                  {/* Action */}
                  {trip.status === "planning" ? (
                    <span className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                      查看行程 →
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1.5"
                    >
                      <Camera className="w-3 h-3" />
                      添加照片
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {filteredTrips.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无行程</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
