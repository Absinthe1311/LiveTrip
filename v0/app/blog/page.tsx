"use client"

import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Heart, MessageCircle } from "lucide-react"

const blogs = [
  {
    id: 1,
    title: "三月京都，满城樱花如梦",
    excerpt: "伏见稻荷的朱红鸟居配上落樱，是我见过最美的画面。早上六点出发，整条参道只有我一人…",
    author: "Li Mei",
    date: "2天前",
    likes: 234,
    comments: 18,
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=200&q=70",
  },
  {
    id: 2,
    title: "巴厘岛7日，从零到惊艳",
    excerpt: "带着预算5000元，我拿下了五星级Villa和私人泳池。藏在Seminyak背街的这家民宿，绝对是隐藏宝藏…",
    author: "Wang Fang",
    date: "5天前",
    likes: 189,
    comments: 32,
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&q=70",
  },
  {
    id: 3,
    title: "东京拉面地图：米其林之外的宝藏小店",
    excerpt: "不用排队两小时，就能吃到极品拉面。这几条巷子里藏着老板专门为懂行人留的隐秘菜单…",
    author: "Chen Hao",
    date: "1周前",
    likes: 312,
    comments: 45,
    placeholder: "🍜",
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AppSidebar />

      <main className="pt-14 lg:pl-[220px] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-6 lg:px-7">
          {/* Page Header */}
          <div className="mb-4">
            <h1 className="font-serif text-xl font-semibold text-foreground">
              旅行博客
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              分享你的旅行故事与攻略
            </p>
          </div>

          {/* Create Post Bar */}
          <Card className="border-dashed border-[1.5px] mb-4 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-3 p-3.5 px-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs text-white font-medium">
                ZL
              </div>
              <span className="flex-1 text-[13px] text-muted-foreground">
                分享你的旅行故事…
              </span>
              <Button size="sm" className="text-xs h-8">
                发布博客
              </Button>
            </div>
          </Card>

          {/* Blog List */}
          <div className="space-y-2.5">
            {blogs.map(blog => (
              <Card
                key={blog.id}
                className="flex overflow-hidden hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer"
              >
                {/* Left Image */}
                <div className="relative w-[100px] flex-shrink-0">
                  {blog.image ? (
                    <Image
                      src={blog.image}
                      alt={blog.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">
                      {blog.placeholder}
                    </div>
                  )}
                </div>

                {/* Right Body */}
                <div className="flex-1 p-3.5 px-4 flex flex-col">
                  <h3 className="text-sm font-medium text-foreground mb-1 leading-snug">
                    {blog.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-2">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-muted-foreground">
                      by {blog.author} · {blog.date}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {blog.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {blog.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
