"use client"

import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

const destinations = [
  {
    id: 1,
    city: "东京",
    cityEn: "Tokyo",
    duration: "5–8天",
    budget: "¥6k–12k",
    rating: 4.9,
    tag: "🌸 樱花季 HOT",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=75",
  },
  {
    id: 2,
    city: "京都",
    cityEn: "Kyoto",
    duration: "3–5天",
    budget: "¥4k–8k",
    rating: 4.8,
    tag: "⛩ 古韵和风",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=75",
  },
  {
    id: 3,
    city: "巴厘岛",
    cityEn: "Bali",
    duration: "5–7天",
    budget: "¥4k–9k",
    rating: 4.7,
    tag: "🏖 热带度假",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=75",
  },
  {
    id: 4,
    city: "巴黎",
    cityEn: "Paris",
    duration: "7–10天",
    budget: "¥12k–22k",
    rating: 4.8,
    tag: "🗼 浪漫之都",
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=75",
  },
  {
    id: 5,
    city: "巴塞罗那",
    cityEn: "Barcelona",
    duration: "6–8天",
    budget: "¥10k–18k",
    rating: 4.7,
    tag: "🎨 高迪建筑",
    image: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&q=75",
  },
  {
    id: 6,
    city: "泰姬陵",
    cityEn: "Agra",
    duration: "2–3天",
    budget: "¥2k–5k",
    rating: 4.9,
    tag: "🕌 世界奇迹",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=75",
  },
]

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AppSidebar />

      <main className="pt-14 lg:pl-[220px] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-6 lg:px-7">
          {/* Hero Banner */}
          <div className="relative h-[140px] rounded-2xl overflow-hidden mb-5 cursor-pointer group">
            <Image
              src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&q=80"
              alt="Hot Destinations"
              fill
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f4a32]/90 to-[#0f4a32]/40" />
            <div className="absolute inset-0 flex flex-col justify-center px-6">
              <h2 className="font-serif text-[22px] font-semibold text-white mb-1">
                探索热门目的地
              </h2>
              <p className="text-xs text-white/75 max-w-md">
                基于 AI 推荐与 IoT 实时人气数据，为你精选全球旅行胜地
              </p>
            </div>
          </div>

          {/* Destination Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {destinations.map(dest => (
              <Card
                key={dest.id}
                className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
              >
                <div className="relative h-[110px]">
                  <Image
                    src={dest.image}
                    alt={dest.city}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-3.5">
                  <h3 className="font-medium text-foreground mb-1">
                    {dest.city} <span className="text-muted-foreground font-normal">{dest.cityEn}</span>
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                    <span>{dest.duration} · {dest.budget}</span>
                    <span className="text-amber-500 font-semibold">★ {dest.rating}</span>
                  </div>
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-lg bg-secondary text-primary">
                    {dest.tag}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
