"use client";

import { Search, Bell, Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 shadow-subtle">
      <div className="flex items-center h-full">
        {/* Logo Section - same width as sidebar */}
        <div className="w-[220px] h-full flex items-center px-4 border-r border-border shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center">
              <span className="text-lg">✈️</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-semibold text-livetrip-primary-dark leading-tight">
                LiveTrip
              </span>
              <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">
                AI · IoT · Travel
              </span>
            </div>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索目的地、景点、攻略…"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-none outline-none text-sm focus:ring-2 focus:ring-livetrip-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 px-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-livetrip-primary to-emerald-400 text-white text-xs font-medium">
                ZL
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-livetrip-primary-dark hidden sm:inline">
              Zhang Lei
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
