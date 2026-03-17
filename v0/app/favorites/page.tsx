"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface Favorite {
  id: number
  name: string
  location: string
  crowdLevel: "low" | "medium" | "high"
  crowdLabel: string
  weather: string
  image?: string
  placeholder?: string
}

const initialFavorites: Favorite[] = [
  {
    id: 1,
    name: "伏见稻荷大社",
    location: "京都",
    crowdLevel: "low",
    crowdLabel: "人流低",
    weather: "14°C",
    image: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=300&q=70",
  },
  {
    id: 2,
    name: "东京塔",
    location: "东京",
    crowdLevel: "medium",
    crowdLabel: "人流中",
    weather: "16°C",
    image: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=300&q=70",
  },
  {
    id: 3,
    name: "大阪城",
    location: "大阪",
    crowdLevel: "low",
    crowdLabel: "人流低",
    weather: "15°C",
    placeholder: "🏯",
  },
  {
    id: 4,
    name: "富士山",
    location: "静冈",
    crowdLevel: "low",
    crowdLabel: "人流低",
    weather: "3°C 积雪",
    image: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=300&q=70",
  },
]

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState(initialFavorites)

  const handleRemove = (id: number) => {
    setFavorites(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AppSidebar />

      <main className="pt-14 lg:pl-[220px] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-6 lg:px-7">
          {/* Page Header */}
          <div className="mb-3.5">
            <h1 className="font-serif text-xl font-semibold text-foreground">
              我的收藏
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              已收藏 {favorites.length} 处景点
            </p>
          </div>

          {/* Favorites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {favorites.map(place => (
              <Card
                key={place.id}
                className="overflow-hidden transition-all hover:border-primary cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-[88px]">
                  {place.image ? (
                    <Image
                      src={place.image}
                      alt={place.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">
                      {place.placeholder}
                    </div>
                  )}
                </div>

                {/* Body */}
                <CardContent className="p-2.5 px-3">
                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-[13px] font-medium text-foreground">
                      {place.name}
                    </h3>
                    <button
                      onClick={() => handleRemove(place.id)}
                      className="text-[11px] text-red-400 hover:text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                    >
                      移除
                    </button>
                  </div>

                  {/* Location */}
                  <p className="text-[11px] text-muted-foreground mb-2">
                    📍 {place.location}
                  </p>

                  {/* IoT Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md border ${
                        place.crowdLevel === "low"
                          ? "bg-secondary text-primary border-primary/20"
                          : "bg-[#fef3dc] text-[#7a4800] border-[#f5a623]/25"
                      }`}
                    >
                      {place.crowdLabel}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#e8f0fb] text-[#1e4a8a] border border-[#3b82c4]/20">
                      {place.weather}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {favorites.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无收藏景点</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
